/**
 * Rutas de Consultas
 * @description Define todas las rutas REST para la gestión de consultas
 */

const express = require('express');
const router = express.Router();
const ConsultaController = require('../controllers/consultaController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { validateConsulta, validateId } = require('../middleware/validation');

/**
 * @route GET /consultas
 * @description Obtiene todas las consultas con paginación
 * @access Admin
 */
router.get('/', authenticateToken, authorizeAdmin, ConsultaController.getAll);

/**
 * @route GET /consultas/mis-consultas
 * @description Obtiene las consultas del propietario autenticado
 * @access Cliente
 */
router.get('/mis-consultas', authenticateToken, ConsultaController.getMyConsultas);

/**
 * @route GET /consultas/expediente/:expedienteId
 * @description Obtiene consultas por expediente
 * @access Admin + Cliente (solo sus pacientes)
 */
router.get('/expediente/:expedienteId', authenticateToken, ConsultaController.getByExpediente);

/**
 * @route GET /consultas/paciente/:pacienteId
 * @description Obtiene consultas por paciente
 * @access Admin + Cliente (solo sus pacientes)
 */
router.get('/paciente/:pacienteId', authenticateToken, ConsultaController.getByPaciente);

/**
 * @route GET /consultas/:id
 * @description Obtiene una consulta por ID
 * @access Admin + Cliente (solo sus consultas)
 */
router.get('/:id', authenticateToken, validateId, ConsultaController.getById);

/**
 * @route POST /consultas
 * @description Crea una nueva consulta
 * @access Admin
 */
router.post('/', authenticateToken, authorizeAdmin, validateConsulta, ConsultaController.create);

/**
 * @route PUT /consultas/:id
 * @description Actualiza una consulta existente
 * @access Admin
 */
router.put('/:id', authenticateToken, authorizeAdmin, validateId, validateConsulta, ConsultaController.update);

/**
 * @route DELETE /consultas/:id
 * @description Elimina una consulta
 * @access Admin
 */
router.delete('/:id', authenticateToken, authorizeAdmin, validateId, ConsultaController.delete);

module.exports = router;