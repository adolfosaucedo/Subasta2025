// routes/usuariosRouter.js
import express from 'express';
import { body, validationResult } from 'express-validator';

import UsuariosController from '../controllers/UsuariosController.js';
import { uploadCedula } from '../middlewares/uploadCedula.js';
import { UsuariosRepo } from '../models/UsuariosModel.js'; // para el endpoint debug (reemplaza la clase vieja)

const router = express.Router();

/* ============================
   VALIDACIONES (legacy / update)
============================ */
const passwordPolicy = body('password')
  .optional({ nullable: true }) // en update puede no venir
  .isString()
  .custom((v) =>
    !v || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/.test(v)
  )
  .withMessage(
    'La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo.'
  );

const emailValid = body('email')
  .isEmail()
  .withMessage('Debes ingresar un email válido.');

const nombreValid = body('nombre')
  .notEmpty()
  .withMessage('El nombre es obligatorio.');

/* ============================
   MANEJADOR DE ERRORES DE VALIDACIÓN
============================ */
const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 422,
      errores: errors.array().map((e) => e.msg),
    });
  }
  next();
};

/* ============================
   RUTAS (orden importante)
============================ */

/**
 * REGISTRO NUEVO (Sprint 2) — con cédula + verificación de email
 * Espera multipart/form-data:
 *  - fields normales (body): nombres, apellidos, fecha_nacimiento, email, documento, telefono, password, acepta_politicas, [rol_nombre]
 *  - files: cedula_frente (1), cedula_reverso (1)
 */
router.post(
  '/', // => POST /api/usuarios
  uploadCedula.fields([
    { name: 'cedula_frente', maxCount: 1 },
    { name: 'cedula_reverso', maxCount: 1 },
  ]),
  (req, res) => UsuariosController.registrarUsuario(req, res)
);

/**
 * Verificación por email (Sprint 2)
 * GET /api/usuarios/verificar?token=...
 * IMPORTANTE: Definir antes de '/:id_usuario' para que no colisione.
 */
router.get('/verificar', (req, res) => UsuariosController.verificarEmail(req, res));

/**
 * LISTAR (búsqueda por nombre/apellido)
 * GET /api/usuarios
 */
router.get('/', (req, res, next) => UsuariosController.buscar(req, res, next));

/**
 * BUSCAR POR ID
 * GET /api/usuarios/:id_usuario
 */
router.get('/:id_usuario', (req, res, next) => UsuariosController.buscarId(req, res, next));

/**
 * REGISTRO LEGACY (compatibilidad con pantallas viejas)
 * POST /api/usuarios/legacy
 * Usa validaciones simples (email, nombre, password) del flujo anterior.
 */
router.post(
  '/legacy',
  [emailValid, nombreValid, body('password').notEmpty(), validarCampos],
  (req, res, next) => UsuariosController.agregar(req, res, next)
);

/**
 * ACTUALIZAR (si envían password, se hashea en el controller)
 * PUT /api/usuarios/:id_usuario
 */
router.put('/:id_usuario', [passwordPolicy, validarCampos], (req, res, next) =>
  UsuariosController.actualizar(req, res, next)
);

/**
 * ELIMINAR
 * DELETE /api/usuarios/:id_usuario
 */
router.delete('/:id_usuario', (req, res, next) => UsuariosController.eliminar(req, res, next));

/**
 * DEBUG – reemplaza el uso de UsuariosModel por UsuariosRepo (ya unificado)
 * GET /api/usuarios/debug/user/:email
 */
router.get('/debug/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const row = await UsuariosRepo.buscarPorEmail(email);
    res.json({ row, found: !!row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
