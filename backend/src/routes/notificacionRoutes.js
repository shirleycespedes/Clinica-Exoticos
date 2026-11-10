/**
 * Rutas de Notificaciones
 * @description Define endpoints para consultar notificaciones y disparar pruebas
 */

const express = require('express');
const router = express.Router();
const NotificacionController = require('../controllers/notificacionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, NotificacionController.getNotificaciones);
router.put('/marcar-todas', authenticateToken, NotificacionController.markAllAsRead);
router.put('/:id/leida', authenticateToken, NotificacionController.markAsRead);
router.post('/test/:tipo', authenticateToken, NotificacionController.triggerTest);

module.exports = router;

