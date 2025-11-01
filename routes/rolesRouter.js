import express from 'express';
var router = express.Router();
import RolesController from '../controllers/RolesController.js'

router.get('/', function(req, res, next) {
  RolesController.buscar(req, res, next);
});

router.get('/:id_rol', function(req, res, next) {
  RolesController.buscarId(req, res, next)
});

router.post('/', function(req, res, next) {
  RolesController.agregar(req, res, next)
});

router.put('/:id_rol', function(req, res, next) {
  RolesController.actualizar(req, res, next)
});

router.delete('/:id_rol', function(req, res, next) {
  RolesController.eliminar(req, res, next)
});

export default router;
