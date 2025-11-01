import express from 'express';
var router = express.Router();
import BienesController from '../controllers/BienesController.js'

router.get('/', function(req, res, next) {
  BienesController.buscar(req, res, next);
});

router.get('/:id_bien', function(req, res, next) {
  BienesController.buscarId(req, res, next)
});

router.post('/', function(req, res, next) {
  BienesController.agregar(req, res, next)
});

router.put('/:id_bien', function(req, res, next) {
  BienesController.actualizar(req, res, next)
});

router.delete('/:id_bien', function(req, res, next) {
  BienesController.eliminar(req, res, next)
});

export default router;
