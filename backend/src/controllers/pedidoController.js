/**
 * Controlador de Pedidos
 * @description Maneja las solicitudes HTTP relacionadas con las compras de productos y pedidos
 */

const Pedido = require('../models/Pedido');
const { validationResult } = require('express-validator');

class PedidoController {
    /**
     * Crea un nuevo pedido (Checkout de Carrito de Compras)
     */
    static async create(req, res) {
        // Validaciones del request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const userId = req.user.userId;
            const { items, total } = req.body;

            // Generar código de retiro aleatorio de 6 dígitos con prefijo VET-
            const randomCode = Math.floor(100000 + Math.random() * 900000);
            const codigo_retiro = `VET-${randomCode}`;

            const newOrder = await Pedido.create({
                usuario_id: userId,
                items,
                total: parseFloat(total),
                codigo_retiro
            });

            res.status(201).json({
                success: true,
                message: 'Pedido realizado con éxito',
                data: newOrder
            });
        } catch (error) {
            console.error('Error en PedidoController.create:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al procesar la compra',
                error: error.message
            });
        }
    }

    /**
     * Obtiene los pedidos del cliente autenticado
     */
    static async getMyPedidos(req, res) {
        try {
            const userId = req.user.userId;
            const pedidos = await Pedido.findByUsuarioId(userId);

            res.status(200).json({
                success: true,
                message: 'Tus pedidos obtenidos correctamente',
                data: pedidos
            });
        } catch (error) {
            console.error('Error en PedidoController.getMyPedidos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener tus pedidos',
                error: error.message
            });
        }
    }

    /**
     * Obtiene todos los pedidos del sistema (solo Admin)
     */
    static async getAll(req, res) {
        try {
            const pedidos = await Pedido.findAllAdmin();

            res.status(200).json({
                success: true,
                message: 'Pedidos globales obtenidos correctamente',
                data: pedidos
            });
        } catch (error) {
            console.error('Error en PedidoController.getAll:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los pedidos',
                error: error.message
            });
        }
    }

    /**
     * Obtiene el desglose detallado de productos de un pedido
     */
    static async getDetails(req, res) {
        try {
            const { id } = req.params;
            const detalles = await Pedido.findDetailsByPedidoId(id);

            res.status(200).json({
                success: true,
                message: 'Detalle del pedido obtenido correctamente',
                data: detalles
            });
        } catch (error) {
            console.error('Error en PedidoController.getDetails:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el detalle del pedido',
                error: error.message
            });
        }
    }

    /**
     * Cancela un pedido del propio cliente (solo si está pendiente)
     */
    static async cancelByClient(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            await Pedido.cancelByClient(id, userId);

            res.status(200).json({
                success: true,
                message: 'Pedido cancelado correctamente'
            });
        } catch (error) {
            console.error('Error en PedidoController.cancelByClient:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error al cancelar el pedido'
            });
        }
    }

    /**
     * Actualiza el estado de un pedido (solo Admin)
     */
    static async updateEstado(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const { estado } = req.body;

            const updated = await Pedido.updateEstado(id, estado);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Estado del pedido actualizado correctamente'
            });
        } catch (error) {
            console.error('Error en PedidoController.updateEstado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el estado del pedido',
                error: error.message
            });
        }
    }
}

module.exports = PedidoController;
