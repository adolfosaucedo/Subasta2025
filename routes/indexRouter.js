// routes/indexRouter.js
import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../databases/ConexionMariaDBProduccion.js';
import { UsuariosRepo } from '../models/UsuariosModel.js';

const router = express.Router();

/* =============== Middleware =============== */
function isAuth(req, res, next) {
  if (req.session?.user) return next();
  return res.redirect('/login');
}

const toLowerString = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : String(value ?? '').trim().toLowerCase();

const analizarEstadoUsuario = (usuario) => {
  const estadoLower = toLowerString(usuario?.estado || '');

  let estadoPendiente = false;
  let estadoRechazado = false;
  let estadoAprobado = true;

  if (estadoLower) {
    estadoAprobado = false;

    const estadoNumerico = Number(usuario.estado);
    if (!Number.isNaN(estadoNumerico)) {
      if (estadoNumerico === 0) estadoPendiente = true;
      else if (estadoNumerico < 0) estadoRechazado = true;
      else if (estadoNumerico === 1) estadoAprobado = true;
    }

    if (!estadoPendiente && !estadoRechazado && !estadoAprobado) {
      if (['pendiente', 'pending'].includes(estadoLower)) {
        estadoPendiente = true;
      } else if (
        ['rechazado', 'rechazada', 'rejected', 'denegado', 'denegada'].includes(estadoLower)
      ) {
        estadoRechazado = true;
      } else if (
        estadoLower.startsWith('aprob') ||
        ['activo', 'activa', 'habilitado', 'habilitada', 'approved', 'aceptado', 'aceptada', '1'].includes(estadoLower)
      ) {
        estadoAprobado = true;
      }
    }

    if (!estadoPendiente && !estadoRechazado && !estadoAprobado) {
      estadoAprobado = true;
    }
  }

  const emailVal = usuario?.email_verificado;
  let emailVerificado = true;
  if (!(emailVal === null || emailVal === undefined || emailVal === '')) {
    if (typeof emailVal === 'boolean') {
      emailVerificado = emailVal;
    } else {
      const numVal = Number(emailVal);
      if (!Number.isNaN(numVal)) {
        emailVerificado = numVal === 1;
      } else {
        const emailLower = toLowerString(emailVal);
        if (['false', '0', 'pendiente', 'sin verificar', 'no', 'n', 'unverified'].includes(emailLower)) {
          emailVerificado = false;
        } else if (
          [
            'true',
            '1',
            'si',
            'sí',
            'verificado',
            'verificada',
            'aprobado',
            'aprobada',
          ].includes(emailLower)
        ) {
          emailVerificado = true;
        }
      }
    }
  }

  const activoVal = usuario?.activo;
  let activoNormalizado = 1;
  if (!(activoVal === null || activoVal === undefined || activoVal === '')) {
    const numActivo = Number(activoVal);
    if (!Number.isNaN(numActivo)) {
      activoNormalizado = numActivo;
    } else {
      const activoLower = toLowerString(activoVal);
      if (['deshabilitado', 'desactivado', 'inactivo', 'bloqueado', 'suspendido'].includes(activoLower)) {
        activoNormalizado = 2;
      } else if (['activo', 'activa', 'habilitado', 'habilitada', '1', 'si', 'sí'].includes(activoLower)) {
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
    console.warn('Advertencia: error comparando hash bcrypt (web):', err?.message);
  }
  return hashGuardado === passwordPlano;
};


/* =============== Home (render server-side) =============== */
// Carga las subastas activas y pasa `user` a la vista para decidir qué botones mostrar
router.get('/', async (req, res) => {
  try {
    const [subastas] = await pool.query(`
      SELECT 
        s.id_subasta,
        s.id_bien,
        s.fecha_inicio,
        s.fecha_fin,
        s.precio_base,
        s.estado,
        b.titulo        AS titulo_bien,
        b.descripcion   AS descripcion_bien,
        b.valor_inicial AS valor_inicial_bien,
        b.imagen_url    AS imagen_url_bien
      FROM subastas s
      LEFT JOIN bienes b ON s.id_bien = b.id_bien
      WHERE s.estado = 'activa'
      ORDER BY s.fecha_inicio DESC
    `);

    res.render('index', {
      subastas,
      user: req.session.user || null,
    });
  } catch (err) {
    console.error('Error cargando subastas:', err);
    res.render('index', { subastas: [], user: req.session.user || null });
  }
});

/* =============== Autenticación con sesión =============== */
router.get('/login', (req, res) => {
  if (req.session?.user) return res.redirect('/panel');
  // usa tu vista existente auth/login.ejs
  res.render('auth/login', { title: 'Ingresar', error: null });
});

router.post('/login', async (req, res, next) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = (req.body?.password || '').trim();

    if (!email || !password) {
      return res
        .status(400)
        .render('auth/login', { title: 'Ingresar', error: 'Email y contraseña son obligatorios.' });
    }

    // UsuariosRepo devuelve objeto o null
    const usuario = await UsuariosRepo.buscarPorEmail(email);
    if (!usuario) {
      return res
        .status(401)
        .render('auth/login', { title: 'Ingresar', error: 'Credenciales incorrectas.' });
    }

    // Reglas de estado (alineado con tu API)
    const { emailVerificado, estadoPendiente, estadoRechazado, estadoAprobado, estaDeshabilitado } =
      analizarEstadoUsuario(usuario);

    if (!emailVerificado) {
      return res
        .status(401)
        .render('auth/login', { title: 'Ingresar', error: 'Debes verificar tu correo antes de iniciar sesión.' });
    }
    if (!estadoAprobado) {
      const msg = estadoPendiente
        ? 'Tu cuenta está pendiente de aprobación por un administrador.'
        : 'Tu registro fue rechazado. Revisa tu correo.';
      return res.status(estadoPendiente ? 401 : 403).render('auth/login', { title: 'Ingresar', error: msg });
    }
    if (estaDeshabilitado) {
      return res
        .status(403)
        .render('auth/login', { title: 'Ingresar', error: 'Tu cuenta está deshabilitada.' });
    }

    const storedHash = (usuario.password || '').trim();
    const ok = await verificarPassword(password, storedHash);
    if (!ok) {
      return res
        .status(401)
        .render('auth/login', { title: 'Ingresar', error: 'Credenciales incorrectas.' });
    }

    // Guardar sesión mínima para EJS
    req.session.user = {
      id_usuario: usuario.id_usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol_nombre: usuario.rol_nombre || 'Cliente',
    };

    // Redirección por rol (ajusta si tu admin es /menu)
    if (req.session.user.rol_nombre === 'Administrador') {
      return res.redirect('/menu'); // o '/panel' si así lo definiste
    }
    return res.redirect('/');
  } catch (e) {
    console.error('Error en login web:', e);
    return next(e);
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

/* =============== Rutas protegidas =============== */
router.get('/panel', isAuth, (req, res) => {
  res.render('panel/index', { title: 'Panel' });
});

// Si querés proteger admin:
router.get('/admin', isAuth, (req, res) => {
  res.render('admin');
});

/* =============== Detalle de subasta (se mantiene) =============== */
router.get('/subasta/:id_subasta', async (req, res, next) => {
  const { id_subasta } = req.params;
  try {
    const sql = `
      SELECT 
        s.id_subasta,
        s.id_bien,
        s.fecha_inicio,
        s.fecha_fin,
        s.precio_base,
        s.estado,
        b.titulo        AS titulo_bien,
        b.descripcion   AS descripcion_bien,
        b.valor_inicial AS valor_inicial_bien,
        b.imagen_url    AS imagen_url_bien
      FROM subastas s
      LEFT JOIN bienes b ON s.id_bien = b.id_bien
      WHERE s.id_subasta = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [id_subasta]);

    if (!rows || rows.length === 0) {
      return res.status(404).render('error', {
        message: 'Subasta no encontrada',
        error: {}
      });
    }

    const subasta = rows[0];
    return res.render('subasta_detalle', { subasta });
  } catch (err) {
    console.error('Error cargando detalle de subasta:', err);
    return next(err);
  }
});

/* =============== Debug (actualizado a UsuariosRepo) =============== */
// Devuelve 0/1 y el objeto del usuario (no array)
router.get('/debug/usuario/:email', async (req, res) => {
  try {
    const email = (req.params.email || '').trim().toLowerCase();
    const usuario = await UsuariosRepo.buscarPorEmail(email);
    res.json({
      encontrado: usuario ? 1 : 0,
      datos: usuario || null
    });
  } catch (err) {
    console.error('Error en debug/usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
