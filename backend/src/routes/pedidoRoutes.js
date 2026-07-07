/**
 * Rutas de Pedidos
 * @description Define todas las rutas REST para el módulo de compras y pedidos
 */

const express = require('express');
const router = express.Router();
const PedidoController = require('../controllers/pedidoController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const { body } = require('express-validator');

// Validaciones para crear un pedido
const validatePedido = [
    body('items')
        .isArray({ min: 1 }).withMessage('El carrito de compras debe contener al menos un producto'),
    
    body('items.*.producto_id')
        .notEmpty().withMessage('El ID de producto es requerido en los detalles'),
    
    body('items.*.cantidad')
        .isInt({ min: 1 }).withMessage('La cantidad mínima de compra por producto es 1'),
    
    body('items.*.precio_unitario')
        .isFloat({ min: 0 }).withMessage('El precio unitario de los productos debe ser un número válido'),
        
    body('total')
        .notEmpty().withMessage('El total del pedido es requerido')
        .isFloat({ min: 0.01 }).withMessage('El total debe ser mayor a 0')
];

// Validaciones para actualizar estado de un pedido
const validateEstado = [
    body('estado')
        .notEmpty().withMessage('El estado del pedido es requerido')
        .isIn(['pendiente', 'preparando', 'listo', 'retirado', 'cancelado']).withMessage('Estado inválido')
];

/**
 * @route POST /pedidos
 * @description Realiza el checkout del carrito y crea un pedido
 * @access Cliente
 */
router.post('/', authenticateToken, validatePedido, PedidoController.create);

/**
 * @route GET /pedidos/mis-pedidos
 * @description Obtiene el historial de pedidos del cliente autenticado
 * @access Cliente
 */
router.get('/mis-pedidos', authenticateToken, PedidoController.getMyPedidos);

/**
 * @route GET /pedidos
 * @description Obtiene la lista completa de pedidos realizados (solo Admin)
 * @access Admin
 */
router.get('/', authenticateToken, authorizeAdmin, PedidoController.getAll);

/**
 * @route GET /pedidos/:id/detalle
 * @description Obtiene el desglose de productos de un pedido
 * @access Cliente + Admin
 */
router.get('/:id/detalle', authenticateToken, PedidoController.getDetails);

/**
 * @route PUT /pedidos/:id/cancelar
 * @description Cancela un pedido del propio cliente si está pendiente
 * @access Cliente
 */
router.put('/:id/cancelar', authenticateToken, PedidoController.cancelByClient);

/**
 * @route PUT /pedidos/:id/estado
 * @description Actualiza el estado de retiro o preparación del pedido
 * @access Admin
 */
router.put('/:id/estado', authenticateToken, authorizeAdmin, validateEstado, PedidoController.updateEstado);

module.exports = router;
