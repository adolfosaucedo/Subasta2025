import pool from "../databases/ConexionMariaDBProduccion.js";

// Normaliza la salida de pool.query para mysql2 ([rows, fields]) y para wrappers que devuelven rows directo
const q = async (sql, params = []) => {
  const res = await pool.query(sql, params);
  // mysql2/promise => [rows, fields]
  if (Array.isArray(res)) return res;
  // mariadb u otro wrapper => rows
  return [res];
};

export const UsuariosRepo = {
  // Crear usuario (password ya viene hasheado como password_hash)
  crearUsuario: async (u) => {
    const sql = `
      INSERT INTO usuarios 
      (nombres, apellidos, fecha_nacimiento, email, documento, telefono, password, rol_nombre,
       acepta_politicas, email_verificado, estado, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pendiente', 1)
    `;
    const [r] = await q(sql, [
      u.nombres,
      u.apellidos,
      u.fecha_nacimiento || null,
      u.email,
      u.documento,
      u.telefono || null,
      u.password_hash,                 // <- SIEMPRE HASH
      u.rol_nombre || "Cliente",
      u.acepta_politicas ? 1 : 0,
    ]);
    return r.insertId;
  },

  // Guardar ruta de archivo de cédula
  guardarDocumento: async (usuarioId, tipo, ruta) => {
    const sql = `INSERT INTO usuarios_documentos (usuario_id, tipo, ruta) VALUES (?, ?, ?)`;
    await q(sql, [usuarioId, tipo, ruta]);
  },

  // Tokens de verificación de email
  crearTokenVerificacion: async (usuarioId, token, expiraEn) => {
    const sql = `INSERT INTO verificaciones_email (usuario_id, token, expira_en) VALUES (?, ?, ?)`;
    await q(sql, [usuarioId, token, expiraEn]);
  },

  obtenerTokenVerificacion: async (token) => {
    const sql = `
      SELECT ve.*, u.email_verificado 
      FROM verificaciones_email ve 
      JOIN usuarios u ON u.id_usuario = ve.usuario_id
      WHERE ve.token = ? AND ve.usado = 0 AND ve.expira_en > NOW()
      LIMIT 1
    `;
    const [rows] = await q(sql, [token]);
    return rows[0] || null;
  },

  marcarVerificado: async (usuarioId, tokenId) => {
    await q(`UPDATE usuarios SET email_verificado = 1 WHERE id_usuario = ?`, [usuarioId]);
    await q(`UPDATE verificaciones_email SET usado = 1 WHERE id = ?`, [tokenId]);
  },

  // === CONSULTAS DE LECTURA/LOGIN ===

  // Buscar por email (para login)
  buscarPorEmail: async (email) => {
    const sql = `
      SELECT 
        id_usuario, nombres, apellidos, email, telefono, password, rol_nombre,
        email_verificado, estado, activo
      FROM usuarios 
      WHERE email = ? 
      LIMIT 1
    `;
    const [rows] = await q(sql, [email]);
    return rows[0] || null;
  },

  // Buscar por nombre/apellido (para listados)
  buscar: async ({ nombre = "" }) => {
    const patron = `%${nombre.replace(/%20/g, " ")}%`;
    const sql = `
      SELECT 
        id_usuario, 
        CONCAT(COALESCE(nombres,''),' ',COALESCE(apellidos,'')) AS nombre_completo,
        email, telefono, activo, rol_nombre, estado, email_verificado
      FROM usuarios
      WHERE nombres LIKE ? OR apellidos LIKE ?
      ORDER BY id_usuario
    `;
    const [rows] = await q(sql, [patron, patron]);
    return rows;
  },

  // Buscar por ID
  buscarId: async ({ id_usuario }) => {
    const sql = `
      SELECT 
        id_usuario, nombres, apellidos, email, telefono, documento, fecha_nacimiento,
        rol_nombre, activo, estado, email_verificado
      FROM usuarios
      WHERE id_usuario = ?
      LIMIT 1
    `;
    const [rows] = await q(sql, [id_usuario]);
    return rows[0] || null;
  },

  // Agregar (compatibilidad antigua) - NO usar en nuevos flujos
  // Si igual lo usan, exigir hash ya calculado en controller
  agregar: async (data) => {
    const sql = `
      INSERT INTO usuarios 
        (nombres, apellidos, email, telefono, password, activo, rol_nombre, estado, email_verificado)
      VALUES (?, ?, ?, ?, ?, 0, 'Cliente', 'pendiente', 0)
    `;
    const [r] = await q(sql, [
      data.nombres || "",
      data.apellidos || "",
      data.email,
      data.telefono || "",
      data.password_hash || "",   // NO en claro
    ]);
    return r;
  },

  // Actualizar (sin tocar password salvo que se envíe password_hash)
  actualizar: async (data) => {
    // Construcción dinámica para no pisar password si no viene
    const fields = ["nombres = ?", "apellidos = ?", "email = ?", "telefono = ?", "activo = ?"];
    const params = [data.nombres, data.apellidos, data.email, data.telefono, data.activo];

    if (data.password_hash) {
      fields.push("password = ?");
      params.push(data.password_hash);
    }
    fields.push("rol_nombre = ?");
    params.push(data.rol_nombre || "Cliente");

    const sql = `UPDATE usuarios SET ${fields.join(", ")} WHERE id_usuario = ?`;
    params.push(data.id_usuario);

    const [r] = await q(sql, params);
    return r;
  },

  eliminar: async ({ id_usuario }) => {
    const sql = `DELETE FROM usuarios WHERE id_usuario = ?`;
    const [r] = await q(sql, [id_usuario]);
    return r;
  },
};

// Compatibilidad con imports antiguos:
export default UsuariosRepo;
