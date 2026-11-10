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
            const { items, total, metodo_pago, comprobante_pago } = req.body;

            // Generar código de retiro aleatorio de 6 dígitos con prefijo VET-
            const randomCode = Math.floor(100000 + Math.random() * 900000);
            const codigo_retiro = `VET-${randomCode}`;

            const newOrder = await Pedido.create({
                usuario_id: userId,
                items,
                total: parseFloat(total),
                codigo_retiro,
                metodo_pago,
                comprobante_pago
            });

            // Notificación Push: Pedido Recibido (Cliente y Administradores)
            try {
                const NotificationService = require('../services/notificationService');
                NotificationService.notifyPedidoRecibido({
                    usuarioId: userId,
                    codigoRetiro: newOrder.codigo_retiro,
                    total: newOrder.total,
                    pedidoId: newOrder.id
                }).catch(e => console.error('Error enviando push pedido recibido:', e));

                // Notificar a todos los administradores del nuevo pedido en tienda
                NotificationService.notifyAllAdmins({
                    title: '🛒 Nuevo Pedido en Tienda - VetExóticos',
                    body: `Se ha recibido un nuevo pedido #${newOrder.codigo_retiro} por ₡${parseFloat(newOrder.total).toLocaleString('es-CR')}.`,
                    data: {
                        tipo: 'NUEVO_PEDIDO_ADMIN',
                        screen: 'Inventario',
                        pedidoId: String(newOrder.id)
                    }
                }).catch(e => console.error('Error push nuevo pedido admin:', e));
            } catch (notifErr) {
                console.warn('Error al procesar notificación de pedido recibido:', notifErr.message);
            }

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

            try {
                const NotificationService = require('../services/notificationService');
                // Notificar al cliente
                NotificationService.notifyPedidoEstado({
                    usuarioId: userId,
                    codigoRetiro: `PEDIDO #${id}`,
                    estado: 'cancelado',
                    pedidoId: id
                }).catch(e => console.error('Error push cancelación cliente:', e));

                // Notificar a todos los administradores
                NotificationService.notifyAllAdmins({
                    title: '❌ Pedido Cancelado por Cliente - VetExóticos',
                    body: `El cliente ha cancelado el pedido #${id}.`,
                    data: {
                        tipo: 'PEDIDO_CANCELADO_ADMIN',
                        screen: 'Inventario',
                        pedidoId: String(id)
                    }
                }).catch(e => console.error('Error push cancelación admins:', e));
            } catch (notifErr) {
                console.warn('Error en notificación cancelación:', notifErr.message);
            }

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

            // Notificación Push de Estado de Pedido
            try {
                const NotificationService = require('../services/notificationService');
                const pedido = await Pedido.findById(id);
                const codigoRetiro = pedido ? pedido.codigo_retiro : id;

                if (estado === 'listo') {
                    // Notificar al cliente dueño del pedido
                    if (pedido && pedido.usuario_id) {
                        NotificationService.notifyPedidoListo({
                            usuarioId: pedido.usuario_id,
                            codigoRetiro: pedido.codigo_retiro,
                            pedidoId: id
                        }).catch(e => console.error('Error enviando push pedido listo al cliente:', e));
                    }

                    // Notificar a TODOS los administradores
                    NotificationService.notifyAllAdmins({
                        title: '🛍️ Pedido Listo para Retiro - VetExóticos',
                        body: `El pedido #${codigoRetiro} fue marcado como LISTO para ser retirado en clínica.`,
                        data: {
                            tipo: 'PEDIDO_LISTO_ADMIN',
                            screen: 'Inventario',
                            pedidoId: String(id)
                        }
                    }).catch(e => console.error('Error enviando push pedido listo a admins:', e));
                } else {
                    // Notificar al cliente del cambio de estado de su pedido
                    if (pedido && pedido.usuario_id) {
                        NotificationService.notifyPedidoEstado({
                            usuarioId: pedido.usuario_id,
                            codigoRetiro,
                            estado,
                            pedidoId: id
                        }).catch(e => console.error('Error push estado pedido al cliente:', e));
                    }

                    // Notificar a TODOS los administradores
                    NotificationService.notifyAllAdmins({
                        title: '🛍️ Estado de Pedido Actualizado - VetExóticos',
                        body: `El pedido #${codigoRetiro} ahora está en estado: "${estado.toUpperCase()}".`,
                        data: {
                            tipo: 'PEDIDO_ESTADO_CAMBIADO',
                            screen: 'Inventario',
                            pedidoId: String(id)
                        }
                    }).catch(e => console.error('Error push estado pedido a admins:', e));
                }
            } catch (notifErr) {
                console.warn('Error al procesar notificación de pedido:', notifErr.message);
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
