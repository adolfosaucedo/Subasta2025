// controllers/PagosController.js
import PagosModel from "../models/PagosModel.js";

class PagosController {
  static buscar = async (req, res, next) => {
    try {
      const result = await PagosModel.buscar(req.query);
      if (result && result.length > 0) {
        res.json({ status: 200, datos: result });
      } else {
        res.json({ status: 404, datos: [] });
      }
    } catch (error) {
      console.error("Error en buscar pagos:", error);
      next(error);
    }
  };

  static buscarId = async (req, res, next) => {
    try {
      const result = await PagosModel.buscarId(req.params);
      res.json({ status: result.length ? 200 : 404, datos: result[0] || {} });
    } catch (error) {
      console.error("Error en buscarId pago:", error);
      next(error);
    }
  };

  static agregar = async (req, res, next) => {
    try {
      const result = await PagosModel.agregar(req.body);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en agregar pago:", error);
      next(error);
    }
  };

  static actualizar = async (req, res, next) => {
    try {
      const data = { ...req.body, id_pago: req.params.id_pago };
      const result = await PagosModel.actualizar(data);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en actualizar pago:", error);
      next(error);
    }
  };

  static eliminar = async (req, res, next) => {
    try {
      const result = await PagosModel.eliminar(req.params);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en eliminar pago:", error);
      next(error);
    }
  };

  // 🔹 Simulación de Pago (para pruebas sin API PagoPar)
  static simular = async (req, res, next) => {
    try {
      const { id_puja, id_adjudicacion, monto } = req.body;
      const data = {
        id_puja,
        id_adjudicacion,
        monto,
        estado: "Simulado",
        fecha_pago: new Date(),
      };
      const result = await PagosModel.agregar(data);

      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        mensaje: "Pago simulado exitosamente",
        datos: data,
      });
    } catch (error) {
      console.error("Error en simular pago:", error);
      next(error);
    }
  };
}

export default PagosController;
