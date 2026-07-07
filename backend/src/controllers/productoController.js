/**
 * Controlador de Productos
 * @description Maneja las solicitudes HTTP relacionadas con los productos (inventario)
 */

const Producto = require('../models/Producto');
const { validationResult } = require('express-validator');

class ProductoController {
    /**
     * Obtiene el listado de productos
     */
    static async getAll(req, res) {
        try {
            const isAdmin = req.user.rol === 'admin';
            let productos;
            
            if (isAdmin) {
                productos = await Producto.findAllAdmin();
            } else {
                productos = await Producto.findAll();
            }

            res.status(200).json({
                success: true,
                message: 'Productos obtenidos correctamente',
                data: productos
            });
        } catch (error) {
            console.error('Error en ProductoController.getAll:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos',
                error: error.message
            });
        }
    }

    /**
     * Obtiene un producto por su ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const producto = await Producto.findById(id);

            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Producto obtenido correctamente',
                data: producto
            });
        } catch (error) {
            console.error('Error en ProductoController.getById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el producto',
                error: error.message
            });
        }
    }

    /**
     * Crea un nuevo producto (solo Admin)
     */
    static async create(req, res) {
        // Validaciones del request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { nombre, descripcion, precio, stock, activo, iva } = req.body;
            const newProduct = await Producto.create({
                nombre,
                descripcion,
                precio: parseFloat(precio),
                stock: parseInt(stock),
                activo: activo !== undefined ? activo : 1,
                iva: iva !== undefined ? parseInt(iva) : 13
            });

            res.status(201).json({
                success: true,
                message: 'Producto creado correctamente',
                data: newProduct
            });
        } catch (error) {
            console.error('Error en ProductoController.create:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar el producto',
                error: error.message
            });
        }
    }

    /**
     * Actualiza un producto existente (solo Admin)
     */
    static async update(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { nombre, descripcion, precio, stock, activo, iva } = req.body;

            const updatedProduct = await Producto.update(id, {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                stock: parseInt(stock),
                activo: activo !== undefined ? activo : 1,
                iva: iva !== undefined ? parseInt(iva) : 13
            });

            if (!updatedProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado o sin cambios'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Producto actualizado correctamente',
                data: updatedProduct
            });
        } catch (error) {
            console.error('Error en ProductoController.update:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el producto',
                error: error.message
            });
        }
    }

    /**
     * Elimina un producto (desactivación lógica, solo Admin)
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Producto.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Producto desactivado correctamente'
            });
        } catch (error) {
            console.error('Error en ProductoController.delete:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el producto',
                error: error.message
            });
        }
    }
}

module.exports = ProductoController;
