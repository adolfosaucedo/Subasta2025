import pool from "../databases/ConexionMariaDBProduccion.js";

class AdjudicacionesModel {
  static buscar = async (data = {}) => {
    let result = [];
    try {
      const { id_subasta, estado } = data;
      const where = [];
      const params = [];

      if (id_subasta) {
        where.push("a.id_subasta = ?");
        params.push(id_subasta);
      }

      // ✅ Filtro de estado flexible (no sensible a mayúsculas)
      if (estado) {
        where.push("LOWER(a.estado) = LOWER(?)");
        params.push(estado.trim());
      }

      const sql = `
      SELECT 
        a.id_adjudicacion,
        a.id_subasta,
        a.id_puja,
        a.estado,
        s.id_bien,
        b.titulo AS titulo_bien,
        p.monto AS monto_puja,
        u.nombre AS nombre_usuario
      FROM adjudicaciones a
      LEFT JOIN subastas s ON a.id_subasta = s.id_subasta
      LEFT JOIN bienes b ON s.id_bien = b.id_bien
      LEFT JOIN pujas p ON a.id_puja = p.id_puja
      LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY a.id_adjudicacion DESC
    `;

      result = await pool.query(sql, params);
    } catch (error) {
      console.error("Error en buscar adjudicaciones:", error);
    }
    return result;
  };



  static buscarId = async (data) => {
    let result = [];
    try {
      const sql = `
        SELECT a.id_adjudicacion, a.id_subasta, a.id_puja, a.estado,
               s.id_bien, b.titulo AS titulo_bien,
               p.monto AS monto_puja, u.nombre AS nombre_usuario
        FROM adjudicaciones a
        LEFT JOIN subastas s ON a.id_subasta = s.id_subasta
        LEFT JOIN bienes b ON s.id_bien = b.id_bien
        LEFT JOIN pujas p ON a.id_puja = p.id_puja
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE a.id_adjudicacion = ?`;
      result = await pool.query(sql, [data.id_adjudicacion]);
    } catch (error) {
      console.error("Error en buscarId adjudicación:", error);
    }
    return result;
  };

  static agregar = async (data) => {
    let result = [];
    try {
      const sql = `
      INSERT INTO adjudicaciones (id_subasta, id_puja, fecha_adjudicacion, estado)
      VALUES (?, ?, NOW(), ?)`;
      result = await pool.query(sql, [
        data.id_subasta,
        data.id_puja,
        data.estado || "adjudicado",
      ]);
    } catch (error) {
      console.error("Error en agregar adjudicación:", error);
    }
    return result;
  };

  static actualizar = async (data) => {
    let result = [];
    try {
      const sql = `
      UPDATE adjudicaciones
      SET id_subasta = ?, id_puja = ?, estado = ?
      WHERE id_adjudicacion = ?`;
      result = await pool.query(sql, [
        data.id_subasta,
        data.id_puja,
        data.estado || "adjudicado",
        data.id_adjudicacion,
      ]);
    } catch (error) {
      console.error("Error en actualizar adjudicación:", error);
    }
    return result;
  };


  static eliminar = async (data) => {
    let result = [];
    try {
      const sql = `DELETE FROM adjudicaciones WHERE id_adjudicacion = ?`;
      result = await pool.query(sql, [data.id_adjudicacion]);
    } catch (error) {
      console.error("Error en eliminar adjudicación:", error);
    }
    return result;
  };
}

export default AdjudicacionesModel;
