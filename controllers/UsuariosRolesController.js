import UsuariosRolesModel from '../models/UsuariosRolesModel.js'

class UsuariosRolesController {

    static buscarIdUsuario = async (req, res, next) => {
        let datos = { status: 200, data: [] };
        const data = req.params
        const result = await UsuariosRolesModel.buscarIdUsuario(data)
        if (result.length > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

    static agregar = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        const data = req.body
        const result = await UsuariosRolesModel.agregar(data)
        if (result.affectedRows > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

    static actualizar = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        let data = req.body
        console.log(data)
        data.id_usuario_rol = req.params.id_usuario_rol
        console.log(data)
        const result = await UsuariosRolesModel.actualizar(data)
        if (result.affectedRows > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

    static eliminar = async (req, res, next) => {
        let datos = { status: 404, data: {} };
        const data = req.params
        const result = await UsuariosRolesModel.eliminar(data)
        if (result.affectedRows > 0) {
            datos = { status: 200, datos: result };
        }
        res.json(datos)
    }

}

export default UsuariosRolesController