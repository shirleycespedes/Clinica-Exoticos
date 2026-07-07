/**
 * Rutas de Citas
 * @description Define todas las rutas REST para la gestión de citas
 */

const express = require('express');
const router = express.Router();
const CitaController = require('../controllers/citaController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { validateCita, validateId } = require('../middleware/validation');

/**
 * @route GET /citas
 * @description Obtiene todas las citas con paginación
 * @access Admin
 */
router.get('/', authenticateToken, authorizeAdmin, CitaController.getAll);

/**
 * @route GET /citas/mis-citas
 * @description Obtiene las citas del propietario autenticado
 * @access Cliente
 */
router.get('/mis-citas', authenticateToken, CitaController.getMyCitas);

/**
 * @route GET /citas/ocupadas
 * @description Obtiene los horarios ocupados
 * @access Admin + Cliente
 */
router.get('/ocupadas', authenticateToken, CitaController.getOcupadas);

/**
 * @route GET /citas/:id
 * @description Obtiene una cita por ID
 * @access Admin + Cliente (solo sus citas)
 */
router.get('/:id', authenticateToken, validateId, CitaController.getById);

/**
 * @route POST /citas
 * @description Crea una nueva cita
 * @access Admin + Cliente
 */
router.post('/', authenticateToken, validateCita, CitaController.create);

/**
 * @route PUT /citas/:id
 * @description Actualiza una cita existente
 * @access Admin
 */
router.put('/:id', authenticateToken, authorizeAdmin, validateId, validateCita, CitaController.update);

/**
 * @route PUT /citas/:id/cancelar
 * @description Cancela una cita
 * @access Admin + Cliente (solo sus citas)
 */
router.put('/:id/cancelar', authenticateToken, validateId, CitaController.cancel);

/**
 * @route DELETE /citas/:id
 * @description Elimina una cita
 * @access Admin
 */
router.delete('/:id', authenticateToken, authorizeAdmin, validateId, CitaController.delete);

module.exports = router;