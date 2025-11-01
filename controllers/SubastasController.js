// controllers/SubastasController.js
import SubastasModel from "../models/SubastasModel.js";

class SubastasController {
  static buscar = async (req, res, next) => {
    try {
      const result = await SubastasModel.buscar(req.query);
      res.json({ status: result.length ? 200 : 404, datos: result });
    } catch (error) {
      console.error("Error en buscar subastas:", error);
      next(error);
    }
  };

  static buscarId = async (req, res, next) => {
    try {
      const result = await SubastasModel.buscarId(req.params);
      res.json({ status: result.length ? 200 : 404, datos: result[0] || {} });
    } catch (error) {
      console.error("Error en buscarId:", error);
      next(error);
    }
  };

  static agregar = async (req, res, next) => {
    try {
      const result = await SubastasModel.agregar(req.body);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en agregar subasta:", error);
      next(error);
    }
  };

  static actualizar = async (req, res, next) => {
    try {
      const data = { ...req.body, id_subasta: req.params.id_subasta };
      const result = await SubastasModel.actualizar(data);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en actualizar subasta:", error);
      next(error);
    }
  };

  static eliminar = async (req, res, next) => {
    try {
      const result = await SubastasModel.eliminar(req.params);
      res.json({
        status: result.affectedRows > 0 ? 200 : 400,
        datos: result,
      });
    } catch (error) {
      console.error("Error en eliminar subasta:", error);
      next(error);
    }
  };
}

export default SubastasController;
