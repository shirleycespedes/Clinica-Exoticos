/**
 * Controlador de Inventario
 * @description Maneja las operaciones de registro y obtención de movimientos de inventario
 */

const MovimientoInventario = require('../models/MovimientoInventario');
const { validationResult } = require('express-validator');

class InventarioController {
    /**
     * Registra una entrada o salida de inventario y actualiza existencias
     */
    static async registrarMovimiento(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { producto_id, tipo, cantidad, motivo } = req.body;
            const usuario_id = req.user.userId;

            const nuevoMovimiento = await MovimientoInventario.create({
                producto_id,
                tipo,
                cantidad: parseInt(cantidad),
                motivo,
                usuario_id
            });

            res.status(201).json({
                success: true,
                message: `Movimiento de ${tipo} registrado correctamente.`,
                data: nuevoMovimiento
            });

        } catch (error) {
            console.error('Error en registrarMovimiento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor al registrar el movimiento.'
            });
        }
    }

    /**
     * Obtiene el listado histórico de movimientos de inventario
     */
    static async obtenerMovimientos(req, res) {
        try {
            const movimientos = await MovimientoInventario.findAll();
            res.status(200).json({
                success: true,
                data: movimientos
            });
        } catch (error) {
            console.error('Error en obtenerMovimientos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los movimientos de inventario.'
            });
        }
    }

    /**
     * Obtiene los movimientos de un producto específico
     */
    static async obtenerMovimientosDeProducto(req, res) {
        try {
            const { id } = req.params;
            const movimientos = await MovimientoInventario.findByProductoId(id);
            res.status(200).json({
                success: true,
                data: movimientos
            });
        } catch (error) {
            console.error('Error en obtenerMovimientosDeProducto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los movimientos del producto.'
            });
        }
    }
}

module.exports = InventarioController;
