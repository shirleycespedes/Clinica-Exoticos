require('dotenv').config();
const { pool } = require('./src/config/database');

async function migrate() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS notificaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                titulo VARCHAR(255) NOT NULL,
                mensaje TEXT NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                leida TINYINT(1) DEFAULT 0,
                data JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `;
        await pool.query(sql);
        console.log('✅ Tabla notificaciones creada o verificada exitosamente en MySQL');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al crear tabla notificaciones:', err);
        process.exit(1);
    }
}

migrate();

