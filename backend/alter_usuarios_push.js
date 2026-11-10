const { pool } = require('./src/config/database');

async function run() {
    try {
        console.log('Checking push_token column in usuarios...');
        const [columns] = await pool.query('SHOW COLUMNS FROM usuarios');
        const hasPushToken = columns.some(c => c.Field === 'push_token');
        
        if (!hasPushToken) {
            console.log('Adding push_token column to usuarios table...');
            await pool.query('ALTER TABLE usuarios ADD COLUMN push_token VARCHAR(255) NULL');
            console.log('Column push_token added successfully.');
        } else {
            console.log('Column push_token already exists.');
        }

        const [desc] = await pool.query('DESCRIBE usuarios');
        console.log('Updated usuarios table structure:', desc.map(d => ({ Field: d.Field, Type: d.Type })));
    } catch (err) {
        console.error('Error altering table:', err);
    } finally {
        process.exit();
    }
}
run();

