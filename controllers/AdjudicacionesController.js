// controllers/AdjudicacionesController.js
import AdjudicacionesModel from "../models/AdjudicacionesModel.js";

class AdjudicacionesController {
  static buscar = async (req, res, next) => {
    try {
      const result = await AdjudicacionesModel.buscar(req.query);
      res.json({ status: result.length ? 200 : 404, datos: result });
    } catch (error) {
      console.error("Error en buscar adjudicaciones:", error);
      next(error);
    }
  };

  static buscarId = async (req, res, next) => {
    try {
      const result = await AdjudicacionesModel.buscarId(req.params);
      res.json({ status: result.length ? 200 : 404, datos: result[0] || {} });
    } catch (error) {
      console.error("Error en buscarId adjudicación:", error);
      next(error);
    }
  };

  static agregar = async (req, res, next) => {
    try {
      const result = await AdjudicacionesModel.agregar(req.body);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en agregar adjudicación:", error);
      next(error);
    }
  };

  static actualizar = async (req, res, next) => {
    try {
      const data = { ...req.body, id_adjudicacion: req.params.id_adjudicacion };
      const result = await AdjudicacionesModel.actualizar(data);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en actualizar adjudicación:", error);
      next(error);
    }
  };

  static eliminar = async (req, res, next) => {
    try {
      const result = await AdjudicacionesModel.eliminar(req.params);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en eliminar adjudicación:", error);
      next(error);
    }
  };
}

export default AdjudicacionesController;
