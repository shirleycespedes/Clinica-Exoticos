/**
 * Rutas de Productos
 * @description Define todas las rutas REST para el inventario de productos
 */

const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/productoController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { body } = require('express-validator');

// Validaciones para crear/editar productos
const validateProducto = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre del producto es requerido')
        .isLength({ max: 150 }).withMessage('El nombre no puede exceder 150 caracteres'),
    
    body('precio')
        .notEmpty().withMessage('El precio es requerido')
        .isFloat({ min: 0.01 }).withMessage('El precio debe ser un número mayor a 0'),
    
    body('stock')
        .notEmpty().withMessage('El stock inicial es requerido')
        .isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0'),
    
    body('iva')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('El porcentaje de IVA debe ser un entero entre 0 y 100')
];

/**
 * @route GET /productos
 * @description Obtiene el listado de productos
 * @access Cliente + Admin
 */
router.get('/', authenticateToken, ProductoController.getAll);

/**
 * @route GET /productos/:id
 * @description Obtiene un producto por su ID
 * @access Cliente + Admin
 */
router.get('/:id', authenticateToken, ProductoController.getById);

/**
 * @route POST /productos
 * @description Crea un nuevo producto
 * @access Admin
 */
router.post('/', authenticateToken, authorizeAdmin, validateProducto, ProductoController.create);

/**
 * @route PUT /productos/:id
 * @description Actualiza un producto existente
 * @access Admin
 */
router.put('/:id', authenticateToken, authorizeAdmin, validateProducto, ProductoController.update);

/**
 * @route DELETE /productos/:id
 * @description Elimina un producto (desactivación lógica)
 * @access Admin
 */
router.delete('/:id', authenticateToken, authorizeAdmin, ProductoController.delete);

module.exports = router;
