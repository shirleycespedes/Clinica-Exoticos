const mysql = require('mysql2/promise');
const dbConfig = { host: 'localhost', port: 3306, user: 'root', password: 'Cherry1234', database: 'clinica_exoticos' };

async function run() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('Checking columns in productos...');
        const [columns] = await connection.query('SHOW COLUMNS FROM productos');
        const hasIva = columns.some(c => c.Field === 'iva');
        
        if (!hasIva) {
            console.log('Adding iva column to productos table...');
            await connection.query('ALTER TABLE productos ADD COLUMN iva INT DEFAULT 13');
            console.log('Column iva added successfully.');
        } else {
            console.log('Column iva already exists.');
        }

        const [desc] = await connection.query('DESCRIBE productos');
        console.log('New productos table structure:', desc);
    } catch (err) {
        console.error('Error altering table:', err);
    } finally {
        await connection.end();
    }
}
run();
