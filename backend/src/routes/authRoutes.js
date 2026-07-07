/**
 * Rutas de Autenticación
 * @description Define todas las rutas para autenticación (registro, login, perfil)
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
    validateRegister, 
    validateLogin 
} = require('../middleware/validation');

/**
 * @route POST /auth/register
 * @description Registra un nuevo usuario (cliente)
 * @access Public
 */
router.post('/register', validateRegister, AuthController.register);

/**
 * @route POST /auth/login
 * @description Autentica un usuario existente
 * @access Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route GET /auth/profile
 * @description Obtiene el perfil del usuario autenticado
 * @access Private (requiere token JWT)
 */
router.get('/profile', authenticateToken, AuthController.getProfile);
router.get('/admins', authenticateToken, AuthController.getAdmins);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.put('/change-password', authenticateToken, AuthController.changePassword);
router.get('/users', authenticateToken, AuthController.getUsers);
router.delete('/users/:id', authenticateToken, AuthController.deleteUser);
router.delete('/profile', authenticateToken, AuthController.deleteOwnAccount);

module.exports = router;