const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Cherry1234',
    database: 'clinica_exoticos'
};

async function list() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT id, nombre, email, rol, fecha_creacion FROM usuarios');
        console.log('Users in database:', rows);
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) await connection.end();
    }
}
list();
