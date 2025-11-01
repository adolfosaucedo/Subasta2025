import express from 'express';
var router = express.Router();
import UsuariosRolesController from '../controllers/UsuariosRolesController.js'

router.get('/:id_usuario', function(req, res, next) {
  UsuariosRolesController.buscarIdUsuario(req, res, next)
});

router.post('/', function(req, res, next) {
  UsuariosRolesController.agregar(req, res, next)
});

router.put('/:id_usuario_rol', function(req, res, next) {
  UsuariosRolesController.actualizar(req, res, next)
});

router.delete('/:id_usuario_rol', function(req, res, next) {
  UsuariosRolesController.eliminar(req, res, next)
});

export default router;
