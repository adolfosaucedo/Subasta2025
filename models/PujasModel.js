// models/PujasModel.js
import pool from "../databases/ConexionMariaDBProduccion.js";

class PujasModel {
  static buscar = async (data = {}) => {
    let result = [];
    try {
      const { id_subasta, id_usuario } = data;
      const nombre = (data.nombre ?? "").replace(/%20/g, " ");
      const where = [];
      const params = [];

      if (id_subasta) {
        where.push("p.id_subasta = ?");
        params.push(id_subasta);
      }
      if (id_usuario) {
        where.push("p.id_usuario = ?");
        params.push(id_usuario);
      }
      if (nombre) {
        where.push("u.nombre LIKE ?");
        params.push(`%${nombre}%`);
      }

      const sql = `
        SELECT p.id_puja, p.id_subasta, p.id_usuario, p.monto, p.fecha_puja,
               u.nombre AS nombre_usuario, s.id_bien, s.estado AS estado_subasta
        FROM pujas p
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        LEFT JOIN subastas s ON p.id_subasta = s.id_subasta
        ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY p.fecha_puja DESC`;

      result = await pool.query(sql, params);
    } catch (error) {
      console.error("Error en buscar pujas:", error);
    }
    return result;
  };

  static buscarId = async (data) => {
    let result = [];
    try {
      const sql = `
        SELECT p.id_puja, p.id_subasta, p.id_usuario, p.monto, p.fecha_puja,
               u.nombre AS nombre_usuario
        FROM pujas p
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE p.id_puja = ?`;
      result = await pool.query(sql, [data.id_puja]);
    } catch (error) {
      console.error("Error en buscarId puja:", error);
    }
    return result;
  };

  static agregar = async (data) => {
    let result = [];
    try {
      const sql = `
        INSERT INTO pujas (id_subasta, id_usuario, monto, fecha_puja)
        VALUES (?, ?, ?, NOW())`;
      result = await pool.query(sql, [
        data.id_subasta,
        data.id_usuario,
        data.monto,
      ]);
    } catch (error) {
      console.error("Error en agregar puja:", error);
    }
    return result;
  };

  static actualizar = async (data) => {
    let result = [];
    try {
      const sql = `
        UPDATE pujas
        SET id_subasta = ?, id_usuario = ?, monto = ?, fecha_puja = NOW()
        WHERE id_puja = ?`;
      result = await pool.query(sql, [
        data.id_subasta,
        data.id_usuario,
        data.monto,
        data.id_puja,
      ]);
    } catch (error) {
      console.error("Error en actualizar puja:", error);
    }
    return result;
  };

  static eliminar = async (data) => {
    let result = [];
    try {
      const sql = `DELETE FROM pujas WHERE id_puja = ?`;
      result = await pool.query(sql, [data.id_puja]);
    } catch (error) {
      console.error("Error en eliminar puja:", error);
    }
    return result;
  };
}

export default PujasModel;
