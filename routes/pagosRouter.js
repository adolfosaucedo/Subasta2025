// routes/pagosRouter.js
import express from "express";
import PagosController from "../controllers/PagosController.js";

const router = express.Router();

// Listar todos los pagos o filtrar por adjudicación o usuario
router.get("/", PagosController.buscar);

// Buscar pago específico
router.get("/:id_pago", PagosController.buscarId);

// Crear un pago (por ejemplo, desde el simulador)
router.post("/", PagosController.agregar);

// Actualizar estado o monto
router.put("/:id_pago", PagosController.actualizar);

// Eliminar un pago
router.delete("/:id_pago", PagosController.eliminar);

// Simular pago (integración con PagoPar)
router.post("/simular", PagosController.simular);

export default router;
