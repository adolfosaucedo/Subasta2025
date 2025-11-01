import pool from '../databases/ConexionMariaDBProduccion.js'

class RolesModel {

    static buscar = async (data = {}) => {
        let result = [];
        try {
            // Si no se envía "nombre", se devuelven todos los roles
            const filtro = data?.nombre ? `%${data.nombre.replace(/%20/g, ' ')}%` : '%';
            const sql = `
      SELECT id_rol, nombre_rol
      FROM roles
      WHERE nombre_rol LIKE ?
      ORDER BY id_rol
    `;
            result = await pool.query(sql, [filtro]);
        } catch (error) {
            console.error("ERROR --->", error);
        }
        return result;
    };


    static buscarId = async (data) => {
        let result = []
        try {
            const sql = `select id_rol, nombre_rol 
            from roles
            where id_rol = ?`
            result = await pool.query(sql, [data.id_rol])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

    static agregar = async (data) => {
        let result = []
        try {
            const sql = `insert into roles (nombre_rol) 
            values (?)`
            result = await pool.query(sql, [data.nombre_rol])
        } catch (error) {
            console.error('ERRPR --->', error)
        }
        return result
    }

    static actualizar = async (data) => {
        let result = []
        try {
            const sql = `update roles set nombre_rol = ?  where id_rol = ?`
            result = await pool.query(sql, [data.nombre_rol, data.id_rol])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

    static eliminar = async (data) => {

        let result = []
        try {
            const sql = `delete from roles where id_rol = ?`
            result = await pool.query(sql, [data.id_rol])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

}

export default RolesModel