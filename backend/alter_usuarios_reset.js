const { pool } = require('./src/config/database');

async function run() {
    try {
        console.log('Checking columns in usuarios...');
        const [columns] = await pool.query('SHOW COLUMNS FROM usuarios');
        const hasResetCode = columns.some(c => c.Field === 'reset_code');
        const hasResetExpires = columns.some(c => c.Field === 'reset_expires');
        
        if (!hasResetCode) {
            console.log('Adding reset_code column to usuarios table...');
            await pool.query('ALTER TABLE usuarios ADD COLUMN reset_code VARCHAR(6) NULL');
            console.log('Column reset_code added successfully.');
        } else {
            console.log('Column reset_code already exists.');
        }

        if (!hasResetExpires) {
            console.log('Adding reset_expires column to usuarios table...');
            await pool.query('ALTER TABLE usuarios ADD COLUMN reset_expires DATETIME NULL');
            console.log('Column reset_expires added successfully.');
        } else {
            console.log('Column reset_expires already exists.');
        }

        const [desc] = await pool.query('DESCRIBE usuarios');
        console.log('New usuarios table structure:', desc);
    } catch (err) {
        console.error('Error altering table:', err);
    } finally {
        process.exit();
    }
}
run();
