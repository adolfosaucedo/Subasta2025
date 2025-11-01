// controllers/PujasController.js
import PujasModel from "../models/PujasModel.js";

class PujasController {
  static buscar = async (req, res, next) => {
    try {
      const result = await PujasModel.buscar(req.query);
      res.json({ status: result.length ? 200 : 404, datos: result });
    } catch (error) {
      console.error("Error en buscar pujas:", error);
      next(error);
    }
  };

  static buscarId = async (req, res, next) => {
    try {
      const result = await PujasModel.buscarId(req.params);
      res.json({ status: result.length ? 200 : 404, datos: result[0] || {} });
    } catch (error) {
      console.error("Error en buscarId puja:", error);
      next(error);
    }
  };

  static agregar = async (req, res, next) => {
    try {
      const result = await PujasModel.agregar(req.body);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en agregar puja:", error);
      next(error);
    }
  };

  static actualizar = async (req, res, next) => {
    try {
      const data = { ...req.body, id_puja: req.params.id_puja };
      const result = await PujasModel.actualizar(data);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en actualizar puja:", error);
      next(error);
    }
  };

  static eliminar = async (req, res, next) => {
    try {
      const result = await PujasModel.eliminar(req.params);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en eliminar puja:", error);
      next(error);
    }
  };
}

export default PujasController;
