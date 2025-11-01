// routes/adjudicacionesRouter.js
import express from "express";
import AdjudicacionesController from "../controllers/AdjudicacionesController.js";

const router = express.Router();

// Listar adjudicaciones (opcionalmente por subasta o usuario)
router.get("/", AdjudicacionesController.buscar);

// Buscar una adjudicación por ID
router.get("/:id_adjudicacion", AdjudicacionesController.buscarId);

// Crear una adjudicación (normalmente tras cerrar una subasta)
router.post("/", AdjudicacionesController.agregar);

// Actualizar una adjudicación
router.put("/:id_adjudicacion", AdjudicacionesController.actualizar);

// Eliminar una adjudicación
router.delete("/:id_adjudicacion", AdjudicacionesController.eliminar);

export default router;
