import BienesModel from '../models/BienesModel.js'

class BienesController {

    static buscar = async (req, res, next) => {
        const data = req.query;
        let datos = { status: 404, datos: [] };
        const result = await BienesModel.buscar(data)
        if (result.length > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

    static buscarId = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        const data = req.params
        const result = await BienesModel.buscarId(data)
        if (result.length > 0) {
            datos = { status: 200, datos: result[0] };
        }
        res.json(datos)
    }

    static agregar = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        const data = req.body
        const result = await BienesModel.agregar(data)
        if (result.affectedRows > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

    static actualizar = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        let data = req.body
        console.log(data)
        data.id_bien = req.params.id_bien
        console.log(data)
        const result = await BienesModel.actualizar(data)
        if (result.affectedRows > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

    static eliminar = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        const data = req.params
        const result = await BienesModel.eliminar(data)
        if (result.affectedRows > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

}

export default BienesController