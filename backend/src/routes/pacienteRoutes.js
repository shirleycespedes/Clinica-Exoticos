/**
 * Rutas de Pacientes
 * @description Define todas las rutas REST para la gestión de pacientes
 */

const express = require('express');
const router = express.Router();
const PacienteController = require('../controllers/pacienteController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { validatePaciente, validateId } = require('../middleware/validation');

/**
 * @route GET /pacientes
 * @description Obtiene todos los pacientes con paginación
 * @access Admin
 */
router.get('/', authenticateToken, authorizeAdmin, PacienteController.getAll);

/**
 * @route GET /pacientes/mis-pacientes
 * @description Obtiene los pacientes del propietario autenticado
 * @access Cliente
 */
router.get('/mis-pacientes', authenticateToken, PacienteController.getMyPacientes);

/**
 * @route GET /pacientes/search
 * @description Busca pacientes por término
 * @access Admin
 */
router.get('/search', authenticateToken, authorizeAdmin, PacienteController.search);

/**
 * @route GET /pacientes/propietario/:propietarioId
 * @description Obtiene pacientes por propietario
 * @access Admin
 */
router.get('/propietario/:propietarioId', authenticateToken, authorizeAdmin, PacienteController.getByPropietario);

/**
 * @route GET /pacientes/:id
 * @description Obtiene un paciente por ID
 * @access Admin + Cliente (solo sus pacientes)
 */
router.get('/:id', authenticateToken, validateId, PacienteController.getById);

/**
 * @route POST /pacientes
 * @description Crea un nuevo paciente
 * @access Admin
 */
router.post('/', authenticateToken, authorizeAdmin, validatePaciente, PacienteController.create);

/**
 * @route PUT /pacientes/:id
 * @description Actualiza un paciente existente
 * @access Admin
 */
router.put('/:id', authenticateToken, authorizeAdmin, validateId, validatePaciente, PacienteController.update);

/**
 * @route DELETE /pacientes/:id
 * @description Elimina un paciente
 * @access Admin + Cliente (dueño)
 */
router.delete('/:id', authenticateToken, validateId, PacienteController.delete);

module.exports = router;