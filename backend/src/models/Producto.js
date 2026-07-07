/**
 * Modelo de Producto
 * @description Maneja las operaciones de base de datos para la tabla de productos (inventario)
 */

const { pool } = require('../config/database');

class Producto {
    /**
     * Obtiene todos los productos activos
     */
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM productos WHERE activo = 1 ORDER BY nombre ASC'
            );
            return rows;
        } catch (error) {
            console.error('Error en Producto.findAll:', error);
            throw new Error('Error al obtener los productos');
        }
    }

    /**
     * Obtiene todos los productos (incluyendo inactivos) - Solo Admin
     */
    static async findAllAdmin() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM productos ORDER BY nombre ASC'
            );
            return rows;
        } catch (error) {
            console.error('Error en Producto.findAllAdmin:', error);
            throw new Error('Error al obtener productos para administración');
        }
    }

    /**
     * Encuentra un producto por su ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM productos WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error en Producto.findById:', error);
            throw new Error('Error al buscar el producto');
        }
    }

    /**
     * Crea un nuevo producto
     */
    static async create(data) {
        try {
            const { nombre, descripcion, precio, stock, activo = 1, iva = 13 } = data;
            const [result] = await pool.execute(
                'INSERT INTO productos (nombre, descripcion, precio, stock, activo, iva) VALUES (?, ?, ?, ?, ?, ?)',
                [nombre, descripcion || null, precio, stock || 0, activo, iva]
            );
            return await this.findById(result.insertId);
        } catch (error) {
            console.error('Error en Producto.create:', error);
            throw new Error('Error al crear el producto');
        }
    }

    /**
     * Actualiza un producto existente
     */
    static async update(id, data) {
        try {
            const { nombre, descripcion, precio, stock, activo = 1, iva = 13 } = data;
            const [result] = await pool.execute(
                'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, activo = ?, iva = ? WHERE id = ?',
                [nombre, descripcion || null, precio, stock, activo, iva, id]
            );
            if (result.affectedRows === 0) return null;
            return await this.findById(id);
        } catch (error) {
            console.error('Error en Producto.update:', error);
            throw new Error('Error al actualizar el producto');
        }
    }

    /**
     * Modifica el stock de un producto (incrementar o decrementar)
     */
    static async updateStock(id, cantidad) {
        try {
            const [result] = await pool.execute(
                'UPDATE productos SET stock = stock + ? WHERE id = ? AND stock + ? >= 0',
                [cantidad, id, cantidad]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Producto.updateStock:', error);
            throw new Error('Error al modificar el stock del producto');
        }
    }

    /**
     * Elimina físicamente o deshabilita un producto
     */
    static async delete(id) {
        try {
            // Deshabilitar lógicamente para no romper claves foráneas de pedidos antiguos
            const [result] = await pool.execute(
                'UPDATE productos SET activo = 0 WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Producto.delete:', error);
            throw new Error('Error al eliminar el producto');
        }
    }
}

module.exports = Producto;
