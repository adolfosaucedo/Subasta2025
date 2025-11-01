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
    if (Number(usuario.email_verificado) !== 1) {
      return res
        .status(401)
        .render('auth/login', { title: 'Ingresar', error: 'Debes verificar tu correo antes de iniciar sesión.' });
    }
    if (usuario.estado !== 'aprobado') {
      const msg = usuario.estado === 'pendiente'
        ? 'Tu cuenta está pendiente de aprobación por un administrador.'
        : 'Tu registro fue rechazado. Revisa tu correo.';
      return res.status(401).render('auth/login', { title: 'Ingresar', error: msg });
    }
    if (Number(usuario.activo) === 2) {
      return res
        .status(403)
        .render('auth/login', { title: 'Ingresar', error: 'Tu cuenta está deshabilitada.' });
    }

    // Comparar contraseña con bcrypt
    const storedHash = (usuario.password || '').trim();
    const ok = await bcrypt.compare(password, storedHash);
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
