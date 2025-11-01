import express from "express";
import multer from "multer";
import fs from "node:fs";
import pool from "../databases/ConexionMariaDBProduccion.js"; // 👈 importá tu conexión

const router = express.Router();
const upload = multer({ dest: "public/img/bienes/" });

// 📸 Ruta para subir imagen de bien y actualizar la DB
router.post("/", upload.single("imagenPerfil"), async (req, res) => {
  try {
    const id_bien = req.query.id_bien; // viene desde el frontend
    if (!req.file) {
      return res.status(400).json({ status: 400, mensaje: "No se recibió archivo" });
    }
    if (!id_bien) {
      return res.status(400).json({ status: 400, mensaje: "Falta el parámetro id_bien" });
    }

    // Renombrar archivo con el id del bien
    const extension = req.file.originalname.split(".").pop();
    const fileName = `${id_bien}.${extension}`;
    const newPath = `public/img/bienes/${fileName}`;

    fs.renameSync(req.file.path, newPath);

    const imagen_url = `/img/bienes/${fileName}`;

    // Actualizar en la base de datos
    const sql = `UPDATE bienes SET imagen_url = ? WHERE id_bien = ?`;
    await pool.query(sql, [imagen_url, id_bien]);

    console.log(`✅ Imagen actualizada en DB: ${imagen_url}`);

    return res.json({
      status: 200,
      mensaje: "Imagen subida y URL actualizada correctamente",
      imagen_url,
    });
  } catch (error) {
    console.error("❌ Error subiendo imagen:", error);
    return res.status(500).json({ status: 500, mensaje: "Error en el servidor", error });
  }
});

export default router;
