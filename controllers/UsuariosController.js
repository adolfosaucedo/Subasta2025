// controllers/UsuariosController.js
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

import { UsuariosRepo } from "../models/UsuariosModel.js";
import UsuariosRolesModel from "../models/UsuariosRolesModel.js"; // si mantenés compatibilidad con tabla de roles
import { isStrongPassword } from "../helpers/validators.js";
import { sendMail } from "../config/mailer.js";

const DEFAULT_ROL_ID = 3; // Comprador (compatibilidad con tu esquema antiguo)

// util para mover archivos de la cédula
const moveFile = async (from, to) => {
  const dir = path.dirname(to);
  await fs.mkdir(dir, { recursive: true });
  await fs.rename(from, to);
};

const toLowerString = (value) =>
  typeof value === "string"
    ? value.trim().toLowerCase()
    : String(value ?? "")
        .trim()
        .toLowerCase();

const analizarEstadoUsuario = (usuario) => {
  const estadoLower = toLowerString(usuario?.estado || "");

  let estadoPendiente = false;
  let estadoRechazado = false;
  let estadoAprobado = true; // compatibilidad: si no hay estado asumimos aprobado

  if (estadoLower) {
    estadoAprobado = false;

    const estadoNumerico = Number(usuario.estado);
    if (!Number.isNaN(estadoNumerico)) {
      if (estadoNumerico === 0) estadoPendiente = true;
      else if (estadoNumerico < 0) estadoRechazado = true;
      else if (estadoNumerico === 1) estadoAprobado = true;
    }

    if (!estadoPendiente && !estadoRechazado && !estadoAprobado) {
      if (["pendiente", "pending"].includes(estadoLower)) {
        estadoPendiente = true;
      } else if (
        ["rechazado", "rechazada", "rejected", "denegado", "denegada"].includes(
          estadoLower
        )
      ) {
        estadoRechazado = true;
      } else if (
        estadoLower.startsWith("aprob") ||
        [
          "activo",
          "activa",
          "habilitado",
          "habilitada",
          "approved",
          "aceptado",
          "aceptada",
          "1",
        ].includes(estadoLower)
      ) {
        estadoAprobado = true;
      }
    }

    if (!estadoPendiente && !estadoRechazado && !estadoAprobado) {
      // fallback para cualquier otro texto desconocido
      estadoAprobado = true;
    }
  }

  const emailVal = usuario?.email_verificado;
  let emailVerificado = true;
  if (!(emailVal === null || emailVal === undefined || emailVal === "")) {
    if (typeof emailVal === "boolean") {
      emailVerificado = emailVal;
    } else {
      const numVal = Number(emailVal);
      if (!Number.isNaN(numVal)) {
        emailVerificado = numVal === 1;
      } else {
        const emailLower = toLowerString(emailVal);
        if (
          [
            "false",
            "0",
            "pendiente",
            "sin verificar",
            "no",
            "n",
            "unverified",
          ].includes(emailLower)
        ) {
          emailVerificado = false;
        } else if (
          [
            "true",
            "1",
            "si",
            "sí",
            "verificado",
            "verificada",
            "aprobado",
            "aprobada",
          ].includes(emailLower)
        ) {
          emailVerificado = true;
        }
      }
    }
  }

  const activoVal = usuario?.activo;
  let activoNormalizado = 1;
  if (!(activoVal === null || activoVal === undefined || activoVal === "")) {
    const numActivo = Number(activoVal);
    if (!Number.isNaN(numActivo)) {
      activoNormalizado = numActivo;
    } else {
      const activoLower = toLowerString(activoVal);
      if (
        [
          "deshabilitado",
          "desactivado",
          "inactivo",
          "bloqueado",
          "suspendido",
        ].includes(activoLower)
      ) {
        activoNormalizado = 2;
      } else if (
        [
          "activo",
          "activa",
          "habilitado",
          "habilitada",
          "1",
          "si",
          "sí",
        ].includes(activoLower)
      ) {
        activoNormalizado = 1;
      }
    }
  }

  return {
    emailVerificado,
    estadoPendiente,
    estadoRechazado,
    estadoAprobado,
    estaDeshabilitado: activoNormalizado === 2,
  };
};

const verificarPassword = async (passwordPlano, hashGuardado) => {
  if (!hashGuardado) return false;
  try {
    if (await bcrypt.compare(passwordPlano, hashGuardado)) {
      return true;
    }
  } catch (err) {
    console.warn("Advertencia: error comparando hash bcrypt:", err?.message);
  }
  return hashGuardado === passwordPlano;
};

class UsuariosController {
  // === LOGIN SEGURO (bcrypt) ===
  // Usa el esquema nuevo: email_verificado, estado ('pendiente'|'aprobado'|'rechazado'), activo (0/1/2)
  static login = async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.json({
          status: 400,
          mensaje: "Email y contraseña son obligatorios.",
        });
      }

      const usuario = await UsuariosRepo.buscarPorEmail(email);
      if (!usuario) {
        return res.json({ status: 404, mensaje: "Credenciales incorrectas." });
      }

      const {
        emailVerificado,
        estadoPendiente,
        estadoRechazado,
        estadoAprobado,
        estaDeshabilitado,
      } = analizarEstadoUsuario(usuario);
      if (!emailVerificado) {
        return res.json({
          status: 401,
          mensaje: "Debes verificar tu correo antes de iniciar sesión.",
        });
      }

      // 2) Si la cuenta no fue aprobada por admin
      if (!estadoAprobado) {
        if (estadoPendiente) {
          return res.json({
            status: 401,
            mensaje:
              "Tu cuenta está pendiente de aprobación por un administrador.",
          });
        }
        if (estadoRechazado) {
          return res.json({
            status: 403,
            mensaje: "Tu registro fue rechazado. Revisa tu correo.",
          });
        }
      }

      // 3) Compatibilidad con campo activo (0 pendiente, 1 activo, 2 deshabilitado)
      if (estaDeshabilitado) {
        return res.json({
          status: 403,
          mensaje: "Tu cuenta está deshabilitada.",
        });
      }

      const ok = await verificarPassword(password, usuario.password);
      if (!ok) {
        return res.json({ status: 404, mensaje: "Credenciales incorrectas." });
      }

      // no exponer hash
      const user = { ...usuario };
      delete user.password;

      // Token simple (placeholder para mantener compatibilidad con tu front actual)
      const token = Buffer.from(`${user.id_usuario}-${Date.now()}`).toString(
        "base64"
      );

      return res.json({
        status: 200,
        mensaje: "Inicio de sesión exitoso.",
        token,
        datos: user,
      });
    } catch (e) {
      console.error("Error en login:", e);
      next(e);
    }
  };

  // === LISTAR / BUSCAR === (actualizado a esquema nuevo)
  static buscar = async (req, res, next) => {
    try {
      const result = await UsuariosRepo.buscar(req.query || {}); // usa nombres/apellidos
      res.json({ status: 200, datos: result });
    } catch (e) {
      next(e);
    }
  };

  static buscarId = async (req, res, next) => {
    try {
      const data = req.params;
      const row = await UsuariosRepo.buscarId({ id_usuario: data.id_usuario });
      if (row) {
        return res.json({ status: 200, datos: row });
      }
      return res.json({ status: 404, datos: {} });
    } catch (e) {
      next(e);
    }
  };

  // === REGISTRO (LEGADO) ===
  // Mantengo tu endpoint "agregar" para compatibilidad con pantallas viejas (usa nombres/apellidos si te pasan "nombre" único)
  static agregar = async (req, res, next) => {
    try {
      const { nombre, nombres, apellidos, email, telefono, password } =
        req.body || {};

      // Normalizar nombres/apellidos desde "nombre" si viene legacy
      const _nombres = (
        nombres || (nombre ? String(nombre).trim() : "")
      ).trim();
      const _apellidos = apellidos ? String(apellidos).trim() : "";

      if (!_nombres || !email || !password) {
        return res.json({
          status: 400,
          mensaje: "Nombre(s), email y contraseña son obligatorios.",
        });
      }

      // Email único
      const yaExiste = await UsuariosRepo.buscarPorEmail(email);
      if (yaExiste) {
        return res.json({
          status: 409,
          mensaje: "El correo ya está registrado.",
        });
      }

      // Fuerza de contraseña
      if (!isStrongPassword(password)) {
        return res.json({
          status: 422,
          mensaje:
            "La contraseña debe tener mínimo 8 caracteres e incluir mayúscula, minúscula, número y símbolo.",
        });
      }

      // Hash
      const hash = await bcrypt.hash(password, 10);

      // Inserción usando repo (estado=pending, verificado=0)
      const insertId = await UsuariosRepo.crearUsuario({
        nombres: _nombres,
        apellidos: _apellidos,
        fecha_nacimiento: null,
        email,
        documento: null,
        telefono: telefono || null,
        password_hash: hash,
        rol_nombre: "Cliente",
        acepta_politicas: false, // en este flujo legacy no hay checkbox
      });

      // Rol por defecto legado: Comprador (3). Si dejaste usuarios_roles, mantenelo:
      try {
        if (UsuariosRolesModel?.agregar) {
          await UsuariosRolesModel.agregar({
            id_usuario: insertId,
            id_rol: DEFAULT_ROL_ID,
          });
        }
      } catch (e) {
        // silencioso si no existe esa tabla/flujo
        console.warn(
          "Advertencia: UsuariosRolesModel.agregar no disponible o falló:",
          e?.message
        );
      }

      return res.json({
        status: 200,
        mensaje:
          "Registro realizado con éxito. Tu cuenta está pendiente de aprobación por un administrador.",
        datos: {
          id_usuario: insertId,
          nombres: _nombres,
          apellidos: _apellidos,
          email,
          telefono: telefono || "",
          activo: 0,
        },
      });
    } catch (e) {
      console.error("Error en registro (legacy agregar):", e);
      next(e);
    }
  };

  // === REGISTRO NUEVO (Sprint 2): con cédula + verificación email + notificación admin ===
  static registrarUsuario = async (req, res) => {
    try {
      const {
        nombres,
        apellidos,
        fecha_nacimiento,
        email,
        documento,
        telefono,
        password,
        acepta_politicas,
        rol_nombre,
      } = req.body;

      // Validaciones mínimas
      if (
        !nombres ||
        !apellidos ||
        !email ||
        !documento ||
        !password ||
        acepta_politicas !== "1"
      ) {
        return res
          .status(400)
          .json({
            status: 400,
            mensaje: "Datos obligatorios faltantes o TyC no aceptado.",
          });
      }
      if (!req.files?.cedula_frente?.[0] || !req.files?.cedula_reverso?.[0]) {
        return res
          .status(400)
          .json({
            status: 400,
            mensaje: "Debe adjuntar frente y reverso de cédula.",
          });
      }

      const existente = await UsuariosRepo.buscarPorEmail(email);
      if (existente) {
        return res.json({
          status: 409,
          mensaje: "El correo ya está registrado.",
        });
      }

      if (!isStrongPassword(password)) {
        return res.json({
          status: 422,
          mensaje:
            "La contraseña debe tener mínimo 8 caracteres e incluir mayúscula, minúscula, número y símbolo.",
        });
      }

      const hash = await bcrypt.hash(password, 10);

      // Crear usuario en estado "pendiente" y email_verificado=0
      const usuarioId = await UsuariosRepo.crearUsuario({
        nombres,
        apellidos,
        fecha_nacimiento: fecha_nacimiento || null,
        email,
        documento,
        telefono: telefono || null,
        password_hash: hash,
        rol_nombre: rol_nombre || "Cliente",
        acepta_politicas: true,
      });

      // Mover archivos a carpeta definitiva
      const baseDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "cedulas",
        String(usuarioId)
      );
      const frenteTmp = req.files.cedula_frente[0].path;
      const reversoTmp = req.files.cedula_reverso[0].path;

      const frenteDest = path.join(
        baseDir,
        "cedula_frente" + path.extname(frenteTmp)
      );
      const reversoDest = path.join(
        baseDir,
        "cedula_reverso" + path.extname(reversoTmp)
      );

      await moveFile(frenteTmp, frenteDest);
      await moveFile(reversoTmp, reversoDest);

      // Guardar rutas (relativas)
      await UsuariosRepo.guardarDocumento(
        usuarioId,
        "cedula_frente",
        frenteDest.replace(process.cwd(), "")
      );
      await UsuariosRepo.guardarDocumento(
        usuarioId,
        "cedula_reverso",
        reversoDest.replace(process.cwd(), "")
      );

      // Token de verificación por email (15 min)
      const token = uuidv4().replace(/-/g, "");
      const expiraEn = dayjs().add(15, "minute").format("YYYY-MM-DD HH:mm:ss");
      await UsuariosRepo.crearTokenVerificacion(usuarioId, token, expiraEn);

      const verifyLink = `${process.env.APP_BASE_URL}/api/usuarios/verificar?token=${token}`;

      // Enviar correo al usuario
      await sendMail({
        to: email,
        subject: "Verifica tu correo - Plataforma de Subastas",
        html: `
          <h3>¡Bienvenido/a, ${nombres}!</h3>
          <p>Para finalizar tu registro, por favor verifica tu correo:</p>
          <p><a href="${verifyLink}">Verificar ahora</a></p>
          <small>Este enlace expira en 15 minutos.</small>
        `,
      });

      // Notificar al administrador sobre el usuario pendiente
      if (process.env.ADMIN_EMAIL) {
        await sendMail({
          to: process.env.ADMIN_EMAIL,
          subject: "Nuevo usuario pendiente de aprobación",
          html: `
            <h3>Nuevo registro pendiente</h3>
            <p><b>${nombres} ${apellidos}</b> (${email}) se registró y está pendiente de aprobación.</p>
            <p>Documento: ${documento}</p>
          `,
        });
      }

      return res.json({
        status: 200,
        mensaje: "Registro exitoso. Revisa tu email para verificar la cuenta.",
      });
    } catch (err) {
      console.error("Error registrarUsuario:", err);
      return res
        .status(500)
        .json({ status: 500, mensaje: "Error interno al registrar." });
    }
  };

  // === Verificación de email (Sprint 2) ===
  static verificarEmail = async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) return res.status(400).send("Token faltante.");

      const row = await UsuariosRepo.obtenerTokenVerificacion(token);
      if (!row) return res.status(400).send("Token inválido o vencido.");

      // Marcar verificado y token usado
      await UsuariosRepo.marcarVerificado(row.usuario_id, row.id);

      // Redirigir a una página amable (por ejemplo, /login)
      return res.redirect("/login?verified=1");
    } catch (err) {
      console.error("Error verificarEmail:", err);
      return res.status(500).send("Error interno.");
    }
  };

  // === ACTUALIZAR === (hash si envían password)
  static actualizar = async (req, res, next) => {
    try {
      const data = { ...req.body, id_usuario: req.params.id_usuario };

      if (data.password) {
        if (!isStrongPassword(data.password)) {
          return res.json({
            status: 422,
            mensaje:
              "La contraseña debe tener mínimo 8 caracteres e incluir mayúscula, minúscula, número y símbolo.",
          });
        }
        data.password_hash = await bcrypt.hash(data.password, 10);
        delete data.password;
      }

      const result = await UsuariosRepo.actualizar(data);
      if (result.affectedRows > 0) {
        return res.json({ status: 200, datos: result });
      }
      return res.json({ status: 404, datos: {} });
    } catch (e) {
      next(e);
    }
  };

  // === ELIMINAR ===
  static eliminar = async (req, res, next) => {
    try {
      const result = await UsuariosRepo.eliminar({
        id_usuario: req.params.id_usuario,
      });
      if (result.affectedRows > 0) {
        return res.json({ status: 200, datos: result });
      }
      return res.json({ status: 404, datos: {} });
    } catch (e) {
      next(e);
    }
  };
}

export default UsuariosController;
