/**
 * Rutas de Expedientes
 * @description Define todas las rutas REST para la gestión de expedientes
 */

const express = require('express');
const router = express.Router();
const ExpedienteController = require('../controllers/expedienteController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { validateExpediente, validateId } = require('../middleware/validation');

/**
 * @route GET /expedientes/paciente/:pacienteId
 * @description Obtiene el expediente de un paciente
 * @access Admin + Cliente (solo sus pacientes)
 */
router.get('/paciente/:pacienteId', authenticateToken, ExpedienteController.getByPaciente);

/**
 * @route POST /expedientes
 * @description Crea un expediente para un paciente
 * @access Admin
 */
router.post('/', authenticateToken, authorizeAdmin, validateExpediente, ExpedienteController.create);

/**
 * @route PUT /expedientes/:id
 * @description Actualiza un expediente existente
 * @access Admin
 */
router.put('/:id', authenticateToken, authorizeAdmin, validateId, validateExpediente, ExpedienteController.update);

/**
 * @route PUT /expedientes/:id/cerrar
 * @description Cierra un expediente
 * @access Admin
 */
router.put('/:id/cerrar', authenticateToken, authorizeAdmin, validateId, ExpedienteController.cerrar);

/**
 * @route DELETE /expedientes/:id
 * @description Elimina un expediente clínico
 * @access Admin
 */
router.delete('/:id', authenticateToken, authorizeAdmin, validateId, ExpedienteController.delete);

module.exports = router;