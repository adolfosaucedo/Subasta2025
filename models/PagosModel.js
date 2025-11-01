import pool from "../databases/ConexionMariaDBProduccion.js";

class PagosModel {
  // ===========================================================
  // 🔹 BUSCAR PAGOS
  // ===========================================================
  static buscar = async (data = {}) => {
    try {
      const { nombre = "", id_adjudicacion = "" } = data;
      const where = [];
      const params = [];

      if (nombre && nombre.trim() !== "") {
        where.push("(LOWER(u.nombre) LIKE LOWER(?) OR LOWER(b.titulo) LIKE LOWER(?))");
        params.push(`%${nombre.trim()}%`, `%${nombre.trim()}%`);
      }

      if (id_adjudicacion && id_adjudicacion.trim() !== "") {
        where.push("p.id_adjudicacion = ?");
        params.push(id_adjudicacion.trim());
      }

      const sql = `
      SELECT 
        p.id_pago,
        p.id_adjudicacion,
        p.monto,
        p.metodo,
        p.fecha_pago,
        p.estado,
        b.titulo AS titulo_bien,
        u.nombre AS nombre_usuario
      FROM pagos p
      LEFT JOIN adjudicaciones a ON p.id_adjudicacion = a.id_adjudicacion
      LEFT JOIN subastas s ON a.id_subasta = s.id_subasta
      LEFT JOIN bienes b ON s.id_bien = b.id_bien
      LEFT JOIN pujas pu ON a.id_puja = pu.id_puja
      LEFT JOIN usuarios u ON pu.id_usuario = u.id_usuario
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY p.id_pago DESC
    `;

      console.log("🧩 SQL ejecutado (Pagos):", sql);
      console.log("🧩 Parámetros:", params);

      // 🧠 soporte para cualquier retorno del pool (rows o [rows])
      const result = await pool.query(sql, params);
      const rows = Array.isArray(result[0]) ? result[0] : result;

      console.log("📦 Resultados:", rows?.length || 0);
      return rows || [];
    } catch (error) {
      console.error("❌ Error en buscar pagos:", error);
      return [];
    }
  };


  // ===========================================================
  // 🔹 BUSCAR PAGO POR ID
  // ===========================================================
  static buscarId = async (data) => {
    try {
      const sql = `
        SELECT 
          p.id_pago,
          p.id_adjudicacion,
          p.monto,
          p.metodo,
          p.fecha_pago,
          p.estado,
          b.titulo AS titulo_bien,
          u.nombre AS nombre_usuario
        FROM pagos p
        LEFT JOIN adjudicaciones a ON p.id_adjudicacion = a.id_adjudicacion
        LEFT JOIN subastas s ON a.id_subasta = s.id_subasta
        LEFT JOIN bienes b ON s.id_bien = b.id_bien
        LEFT JOIN pujas pu ON a.id_puja = pu.id_puja
        LEFT JOIN usuarios u ON pu.id_usuario = u.id_usuario
        WHERE p.id_pago = ?`;

      const [rows] = await pool.query(sql, [data.id_pago]);
      return rows;
    } catch (error) {
      console.error("Error en buscarId pago:", error);
      return [];
    }
  };

  // ===========================================================
  // 🔹 AGREGAR PAGO
  // ===========================================================
  static agregar = async (data) => {
    try {
      console.log("🧩 Insertando pago con datos:", data);

      // 1️⃣ Insertar pago
      const insertPago = await pool.query(
        `
      INSERT INTO pagos (id_adjudicacion, monto, metodo, estado, fecha_pago)
      VALUES (?, ?, ?, ?, ?)
      `,
        [
          data.id_adjudicacion,
          data.monto,
          data.metodo || "otro",
          data.estado || "confirmado",
          data.fecha_pago || new Date(),
        ]
      );
      console.log("✅ Pago insertado correctamente");

      // 2️⃣ Actualizar adjudicación → 'pagada'
      await pool.query(
        `
      UPDATE adjudicaciones
      SET estado = 'pagada'
      WHERE id_adjudicacion = ?
      `,
        [data.id_adjudicacion]
      );
      console.log("🔄 Adjudicación actualizada a 'pagada'");

      // 3️⃣ Actualizar subasta → 'finalizada'
      await pool.query(
        `
      UPDATE subastas
      SET estado = 'finalizada'
      WHERE id_subasta = (
        SELECT id_subasta FROM adjudicaciones WHERE id_adjudicacion = ?
      )
      `,
        [data.id_adjudicacion]
      );
      console.log("🏁 Subasta asociada actualizada a 'finalizada'");

      return insertPago;
    } catch (error) {
      console.error("❌ Error en agregar pago:", error);
      return [];
    }
  };




  // ===========================================================
  // 🔹 ACTUALIZAR PAGO
  // ===========================================================
  static actualizar = async (data) => {
    try {
      const sql = `
        UPDATE pagos
        SET id_adjudicacion = ?, monto = ?, metodo = ?, estado = ?, fecha_pago = ?
        WHERE id_pago = ?`;

      const [result] = await pool.query(sql, [
        data.id_adjudicacion,
        data.monto,
        data.metodo,
        data.estado,
        data.fecha_pago || new Date(),
        data.id_pago,
      ]);

      console.log("✏️ Pago actualizado:", result);
      return result;
    } catch (error) {
      console.error("Error en actualizar pago:", error);
      return [];
    }
  };

  // ===========================================================
  // 🔹 ELIMINAR PAGO
  // ===========================================================
  static eliminar = async (data) => {
    try {
      const sql = `DELETE FROM pagos WHERE id_pago = ?`;
      const result = await pool.query(sql, [data.id_pago]);

      // 🧠 Manejo compatible con ambas formas de retorno
      const [rows] = Array.isArray(result) ? result : [result];
      console.log("🗑️ Eliminación ejecutada, resultado:", rows);

      return rows;
    } catch (error) {
      console.error("Error en eliminar pago:", error);
      return [];
    }
  };

}

export default PagosModel;
