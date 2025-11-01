// models/SubastasModel.js
import pool from "../databases/ConexionMariaDBProduccion.js";

class SubastasModel {
  static buscar = async (data = {}) => {
    let result = [];
    try {
      const where = [];
      const params = [];

      // ✅ Filtro por título
      if (data.titulo && data.titulo.trim() !== "") {
        const titulo = `%${data.titulo.replace(/%20/g, " ")}%`;
        where.push("b.titulo LIKE ?");
        params.push(titulo);
      }

      // ✅ Filtro por estado (activa, finalizada, etc.)
      if (data.estado && data.estado.trim() !== "") {
        where.push("LOWER(s.estado) = LOWER(?)");
        params.push(data.estado.trim());
      }

      // ✅ Consulta principal con imagen incluida
      const sql = `
        SELECT 
          s.id_subasta,
          s.id_bien,
          s.fecha_inicio,
          s.fecha_fin,
          s.precio_base,
          s.estado,
          b.titulo AS titulo_bien,
          b.descripcion AS descripcion_bien,
          b.imagen_url
        FROM subastas s
        LEFT JOIN bienes b ON s.id_bien = b.id_bien
        ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY s.id_subasta DESC
      `;

      console.log("🧩 SQL ejecutado:", sql);
      console.log("📦 Parámetros:", params);

      result = await pool.query(sql, params);
    } catch (error) {
      console.error("❌ Error en buscar subastas:", error);
    }
    return result;
  };

  static buscarId = async (data) => {
    let result = [];
    try {
      const sql = `
        SELECT 
          s.id_subasta,
          s.id_bien,
          s.fecha_inicio,
          s.fecha_fin,
          s.precio_base,
          s.estado,
          b.titulo AS titulo_bien,
          b.descripcion AS descripcion_bien,
          b.imagen_url
        FROM subastas s
        LEFT JOIN bienes b ON s.id_bien = b.id_bien
        WHERE s.id_subasta = ?`;
      result = await pool.query(sql, [data.id_subasta]);
    } catch (error) {
      console.error("Error en buscarId subasta:", error);
    }
    return result;
  };

  static agregar = async (data) => {
    let result = [];
    try {
      const sql = `
        INSERT INTO subastas (id_bien, fecha_inicio, fecha_fin, precio_base, estado)
        VALUES (?, ?, ?, ?, ?)`;
      result = await pool.query(sql, [
        data.id_bien,
        data.fecha_inicio,
        data.fecha_fin,
        data.precio_base,
        data.estado,
      ]);
    } catch (error) {
      console.error("Error en agregar subasta:", error);
    }
    return result;
  };

  static actualizar = async (data) => {
    let result = [];
    try {
      const sql = `
        UPDATE subastas
        SET id_bien = ?, fecha_inicio = ?, fecha_fin = ?, precio_base = ?, estado = ?
        WHERE id_subasta = ?`;
      result = await pool.query(sql, [
        data.id_bien,
        data.fecha_inicio,
        data.fecha_fin,
        data.precio_base,
        data.estado,
        data.id_subasta,
      ]);
    } catch (error) {
      console.error("Error en actualizar subasta:", error);
    }
    return result;
  };

  static eliminar = async (data) => {
    let result = [];
    try {
      const sql = `DELETE FROM subastas WHERE id_subasta = ?`;
      result = await pool.query(sql, [data.id_subasta]);
    } catch (error) {
      console.error("Error en eliminar subasta:", error);
    }
    return result;
  };
}

export default SubastasModel;
