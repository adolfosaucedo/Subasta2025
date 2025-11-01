// routes/pujasRouter.js
import express from "express";
import PujasController from "../controllers/PujasController.js";

const router = express.Router();

// Listar todas las pujas o filtrar por subasta/usuario
router.get("/", PujasController.buscar);

// Buscar una puja específica
router.get("/:id_puja", PujasController.buscarId);

// Crear una nueva puja
router.post("/", PujasController.agregar);

// Actualizar una puja existente
router.put("/:id_puja", PujasController.actualizar);

// Eliminar una puja
router.delete("/:id_puja", PujasController.eliminar);

export default router;
