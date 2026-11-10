/**
 * Controlador de Notificaciones
 * @description Maneja la consulta, estado de lectura y disparo de pruebas de notificaciones
 */

const Notificacion = require('../models/Notificacion');
const NotificationService = require('../services/notificationService');

class NotificacionController {
    /**
     * Obtiene todas las notificaciones y el conteo no leídas del usuario
     */
    static async getNotificaciones(req, res) {
        try {
            const userId = req.user.userId || req.user.id;
            const notificaciones = await Notificacion.findByUsuario(userId);
            const unreadCount = await Notificacion.countUnread(userId);

            res.status(200).json({
                success: true,
                data: {
                    notificaciones,
                    unreadCount
                }
            });
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener notificaciones',
                error: error.message
            });
        }
    }

    /**
     * Marca una notificación como leída
     */
    static async markAsRead(req, res) {
        try {
            const userId = req.user.userId || req.user.id;
            const { id } = req.params;
            await Notificacion.markAsRead(id, userId);

            res.status(200).json({
                success: true,
                message: 'Notificación marcada como leída'
            });
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar notificación'
            });
        }
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user.userId || req.user.id;
            await Notificacion.markAllAsRead(userId);

            res.status(200).json({
                success: true,
                message: 'Todas las notificaciones marcadas como leídas'
            });
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar notificaciones'
            });
        }
    }

    /**
     * Dispara una de las 3 notificaciones o las 3 a la vez para pruebas inmediatas
     */
    static async triggerTest(req, res) {
        try {
            const userId = req.user.userId || req.user.id;
            const { tipo } = req.params; // 'cita', 'pedido', 'consulta', 'todas'

            const results = {};

            if (tipo === 'cita' || tipo === 'todas') {
                results.cita = await NotificationService.testCitaConfirmada(userId);
            }
            if (tipo === 'pedido' || tipo === 'todas') {
                results.pedido = await NotificationService.testPedidoListo(userId);
            }
            if (tipo === 'consulta' || tipo === 'todas') {
                results.consulta = await NotificationService.testNuevaConsulta(userId);
            }

            res.status(200).json({
                success: true,
                message: tipo === 'todas' 
                    ? '¡Las 3 notificaciones push han sido enviadas exitosamente!' 
                    : `Notificación push de tipo ${tipo} enviada exitosamente`,
                data: results
            });
        } catch (error) {
            console.error('Error al disparar prueba de notificación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al disparar notificación',
                error: error.message
            });
        }
    }
}

module.exports = NotificacionController;

