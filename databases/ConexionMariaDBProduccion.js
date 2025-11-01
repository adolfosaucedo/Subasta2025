// databases/ConexionMariaDBProduccion.js
import mysql from 'mysql2';
import { promisify } from 'util';
import dotenv from 'dotenv';
dotenv.config();

const user = process.env.MARIASQL_LOCALHOST_USER;
const password = process.env.MARIASQL_LOCALHOST_PASSWORD;
const host = process.env.MARIASQL_LOCALHOST_HOST || '127.0.0.1';
const port = Number(process.env.MARIASQL_LOCALHOST_PORT || 3306);
const database = process.env.MARIASQL_LOCALHOST_DATABASE;

const databaseConfig = {
  connectionLimit: 10,
  host,
  port,
  user,
  password,
  database,
  multipleStatements: false,
};

const pool = mysql.createPool(databaseConfig);

// ---- conexión + healthcheck
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error(`❌ Database ${host}/${database} connection was closed.`);
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error(`❌ Database ${host}/${database} has too many connections.`);
    }
    if (err.code === 'ECONNREFUSED') {
      console.error(`❌ Database ${host}/${database} connection was refused.`);
    }
    console.error('Detalle:', err.message);
    return;
  }

  if (connection) connection.release();

  console.log(`✅ Conexión exitosa a MariaDB ${host}:${port} DB ${database}`);
  // Healthcheck: ¿a qué base estoy conectado?
  pool.query('SELECT DATABASE() AS db', (e, rows) => {
    if (e) return console.error('Healthcheck error:', e.message);
    console.log(`🧭 DATABASE() => ${rows?.[0]?.db}`);
  });
});

// Promisify Pool Query
pool.query = promisify(pool.query);

export default pool;
