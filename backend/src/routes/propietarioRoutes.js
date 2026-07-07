/**
 * Rutas de Propietarios
 * @description Define todas las rutas REST para la gestión de propietarios
 */

const express = require('express');
const router = express.Router();
const PropietarioController = require('../controllers/propietarioController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { validatePropietario, validateId } = require('../middleware/validation');

/**
 * @route GET /propietarios
 * @description Obtiene todos los propietarios con paginación
 * @access Admin
 */
router.get('/', authenticateToken, authorizeAdmin, PropietarioController.getAll);

/**
 * @route GET /propietarios/mi-perfil
 * @description Obtiene el propietario del usuario autenticado
 * @access Cliente
 */
router.get('/mi-perfil', authenticateToken, PropietarioController.getMyPropietario);

/**
 * @route GET /propietarios/search
 * @description Busca propietarios por término
 * @access Admin
 */
router.get('/search', authenticateToken, authorizeAdmin, PropietarioController.search);

/**
 * @route GET /propietarios/:id
 * @description Obtiene un propietario por ID
 * @access Admin
 */
router.get('/:id', authenticateToken, authorizeAdmin, validateId, PropietarioController.getById);

/**
 * @route POST /propietarios
 * @description Crea un nuevo propietario
 * @access Admin
 */
router.post('/', authenticateToken, authorizeAdmin, validatePropietario, PropietarioController.create);

/**
 * @route PUT /propietarios/:id
 * @description Actualiza un propietario existente
 * @access Admin
 */
router.put('/:id', authenticateToken, authorizeAdmin, validateId, validatePropietario, PropietarioController.update);

/**
 * @route DELETE /propietarios/:id
 * @description Elimina un propietario
 * @access Admin
 */
router.delete('/:id', authenticateToken, authorizeAdmin, validateId, PropietarioController.delete);

module.exports = router;