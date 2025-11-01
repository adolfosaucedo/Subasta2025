import pool from '../databases/ConexionMariaDBProduccion.js'

class BienesModel {

    static buscar = async (data) => {
        let result = []
        try {
            const buscar_nombre = `%${data.nombre.replace(/%20/g, ' ')}%`;
            const sql = `select b.id_bien, b.id_usuario, b.titulo, b.descripcion, b.valor_inicial, b.imagen_url,
                         u.nombre nombre_usuario
                         from bienes b
                         left join usuarios u on b.id_usuario = u.id_usuario
                         where b.titulo like ?
                         order by b.id_bien`
            result = await pool.query(sql, [buscar_nombre])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

    static buscarId = async (data) => {
        console.log(data)
        let result = []
        try {
            const sql = `select b.id_bien, b.id_usuario, b.titulo, b.descripcion, b.valor_inicial, b.imagen_url,
                         u.nombre nombre_usuario
                         from bienes b
                         left join usuarios u on b.id_usuario = u.id_usuario
                         where b.id_bien = ?`
            result = await pool.query(sql, [data.id_bien])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

    static agregar = async (data) => {
        let result = [];
        try {
            const sql = `
      INSERT INTO bienes (id_usuario, titulo, descripcion, valor_inicial, imagen_url, fecha_registro)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
            result = await pool.query(sql, [
                data.id_usuario,
                data.titulo,
                data.descripcion,
                data.valor_inicial,
                data.imagen_url || null,
            ]);
        } catch (error) {
            console.error("ERROR --->", error);
        }
        return result;
    };


    static actualizar = async (data) => {
        let result = []
        try {
            const sql = `update bienes set id_usuario = ?, titulo = ?, descripcion = ?, valor_inicial = ?  where id_bien = ?`
            result = await pool.query(sql, [data.id_usuario, data.titulo, data.descripcion, data.valor_inicial, data.id_bien])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

    static eliminar = async (data) => {

        let result = []
        try {
            const sql = `delete from bienes where id_bien = ?`
            result = await pool.query(sql, [data.id_bien])
        } catch (error) {
            console.error('ERROR --->', error)
        }
        return result
    }

}

export default BienesModel