import pool from '../databases/ConexionMariaDBProduccion.js'

class UsuariosRolesModel {
  
    static buscarIdUsuario = async (data) => {
        let result = []
        try {
            const sql = `select id_usuario_rol, id_usuario, id_rol from usuarios_roles
            where id_usuario = ?`
            result = await pool.query(sql, [data.id_usuario])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

    static agregar = async (data) => {
        let result = []
        try {
            const sql = `insert into usuarios_roles (id_usuario,id_rol) 
            values (?,?)`
            result = await pool.query(sql, [data.id_usuario, data.id_rol])
        } catch (error) {
            console.error('ERRPR --->', error)
        }
        return result
    }

    static actualizar = async (data) => {
        let result = []
        try {
            const sql = `update usuarios_roles set id_rol = ? where id_usuario_rol = ?`
            result = await pool.query(sql, [data.id_rol, data.id_usuario_rol])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

    static eliminar = async (data) => {
        
        let result = []
        try {
            const sql = `delete from usuarios_roles where id_usuario_rol = ?`
            result = await pool.query(sql, [data.id_usuario_rol])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

}

export default UsuariosRolesModel