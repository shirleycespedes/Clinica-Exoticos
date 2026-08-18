const { pool } = require('./database');

async function run() {
    try {
        console.log('Creando tabla movimientos_inventario...');
        
        // Crear la tabla de movimientos de inventario con tipos de datos coincidentes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS movimientos_inventario (
                id INT AUTO_INCREMENT PRIMARY KEY,
                producto_id INT UNSIGNED NOT NULL,
                tipo ENUM('entrada', 'salida') NOT NULL,
                cantidad INT NOT NULL,
                motivo VARCHAR(255) NOT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario_id INT NOT NULL,
                CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
                CONSTRAINT fk_movimiento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ Tabla movimientos_inventario inicializada correctamente.');

        // Verificar la estructura de la tabla
        const [desc] = await pool.query('DESCRIBE movimientos_inventario');
        console.log('Estructura de movimientos_inventario:', desc);

    } catch (err) {
        console.error('❌ Error al inicializar la tabla movimientos_inventario:', err);
    } finally {
        process.exit();
    }
}

run();
