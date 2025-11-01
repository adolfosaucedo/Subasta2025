import RolesModel from '../models/RolesModel.js'

class RolesController {

    static buscar = async (req, res, next) => {
        const data = req.query;
        let datos = { status: 404, datos: [] };
        const result = await RolesModel.buscar(data)
        if (result.length > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

    static buscarId = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        const data = req.params
        const result = await RolesModel.buscarId(data)
        if (result.length > 0) {
            datos = { status: 200, datos: result[0] };
        }
        res.json(datos)
    }

    static agregar = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        const data = req.body
        const result = await RolesModel.agregar(data)
        if (result.affectedRows > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

    static actualizar = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        let data = req.body
        console.log(data)
        data.id_rol = req.params.id_rol
        console.log(data)
        const result = await RolesModel.actualizar(data)
        if (result.affectedRows > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

    static eliminar = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        const data = req.params
        const result = await RolesModel.eliminar(data)
        if (result.affectedRows > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

}

export default RolesController