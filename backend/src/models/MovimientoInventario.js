/**
 * Modelo de Movimiento de Inventario
 * @description Maneja las operaciones de base de datos para registrar entradas/salidas de inventario y actualizar el stock
 */

const { pool } = require('../config/database');

class MovimientoInventario {
    /**
     * Registra un nuevo movimiento y actualiza las existencias del producto
     */
    static async create(data) {
        const { producto_id, tipo, cantidad, motivo, usuario_id } = data;

        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Verificar si el producto existe y obtener su stock actual
            const [productRows] = await connection.query(
                'SELECT stock, nombre FROM productos WHERE id = ? FOR UPDATE',
                [producto_id]
            );

            const product = productRows[0];
            if (!product) {
                throw new Error(`El producto con ID ${producto_id} no existe.`);
            }

            // 2. Si es una salida, verificar que haya stock suficiente
            if (tipo === 'salida' && product.stock < cantidad) {
                throw new Error(`Existencias insuficientes para registrar la salida de "${product.nombre}". Disponible: ${product.stock}, Solicitado: ${cantidad}`);
            }

            // 3. Insertar el movimiento en la base de datos
            const [result] = await connection.query(
                `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id) 
                 VALUES (?, ?, ?, ?, ?)`,
                [producto_id, tipo, cantidad, motivo, usuario_id]
            );

            const movimientoId = result.insertId;

            // 4. Actualizar el stock del producto
            const stockDiff = tipo === 'entrada' ? cantidad : -cantidad;
            await connection.query(
                'UPDATE productos SET stock = stock + ? WHERE id = ?',
                [stockDiff, producto_id]
            );

            await connection.commit();

            // Retornar el movimiento creado con detalles del producto
            const [newMovRows] = await pool.query(
                `SELECT m.*, p.nombre as producto_nombre 
                 FROM movimientos_inventario m
                 JOIN productos p ON m.producto_id = p.id
                 WHERE m.id = ?`,
                [movimientoId]
            );
            return newMovRows[0];

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error en transacción de MovimientoInventario.create:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Obtiene todos los movimientos de inventario registrados con JOIN a productos y usuarios
     */
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                `SELECT m.*, p.nombre as producto_nombre, u.nombre as usuario_nombre, u.email as usuario_email
                 FROM movimientos_inventario m
                 JOIN productos p ON m.producto_id = p.id
                 JOIN usuarios u ON m.usuario_id = u.id
                 ORDER BY m.fecha DESC`
            );
            return rows;
        } catch (error) {
            console.error('Error en MovimientoInventario.findAll:', error);
            throw new Error('Error al obtener el historial de movimientos de inventario.');
        }
    }

    /**
     * Obtiene los movimientos de un producto específico
     */
    static async findByProductoId(productoId) {
        try {
            const [rows] = await pool.execute(
                `SELECT m.*, u.nombre as usuario_nombre
                 FROM movimientos_inventario m
                 JOIN usuarios u ON m.usuario_id = u.id
                 WHERE m.producto_id = ?
                 ORDER BY m.fecha DESC`,
                [productoId]
            );
            return rows;
        } catch (error) {
            console.error('Error en MovimientoInventario.findByProductoId:', error);
            throw new Error('Error al obtener movimientos del producto.');
        }
    }
}

module.exports = MovimientoInventario;
