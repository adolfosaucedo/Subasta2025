// routes/subastasRouter.js
import express from "express";
import SubastasController from "../controllers/SubastasController.js";

const router = express.Router();

// Listar todas las subastas o buscar por filtro
router.get("/", SubastasController.buscar);

// Buscar una subasta por ID
router.get("/:id_subasta", SubastasController.buscarId);

// Crear nueva subasta
router.post("/", SubastasController.agregar);

// Actualizar subasta existente
router.put("/:id_subasta", SubastasController.actualizar);

// Eliminar subasta
router.delete("/:id_subasta", SubastasController.eliminar);

export default router;
