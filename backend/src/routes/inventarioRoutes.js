/**
 * Rutas de Inventario
 * @description Define los endpoints de API para el control de movimientos de inventario
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const InventarioController = require('../controllers/inventarioController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Validaciones para crear un movimiento
const validateMovimiento = [
    body('producto_id')
        .notEmpty().withMessage('El ID del producto es requerido')
        .isInt({ min: 1 }).withMessage('ID de producto inválido'),
    body('tipo')
        .notEmpty().withMessage('El tipo de movimiento es requerido')
        .isIn(['entrada', 'salida']).withMessage('El tipo debe ser "entrada" o "salida"'),
    body('cantidad')
        .notEmpty().withMessage('La cantidad es requerida')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero mayor o igual a 1'),
    body('motivo')
        .trim()
        .notEmpty().withMessage('El motivo es requerido')
        .isLength({ min: 3, max: 255 }).withMessage('El motivo debe tener entre 3 y 255 caracteres')
];

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken);
router.use(authorizeAdmin);

// POST /api/v1/inventario/movimientos
router.post('/movimientos', validateMovimiento, InventarioController.registrarMovimiento);

// GET /api/v1/inventario/movimientos
router.get('/movimientos', InventarioController.obtenerMovimientos);

// GET /api/v1/inventario/movimientos/producto/:id
router.get('/movimientos/producto/:id', InventarioController.obtenerMovimientosDeProducto);

module.exports = router;
