/**
 * Rutas de Autenticación
 * @description Define todas las rutas para autenticación (registro, login, perfil, push notifications)
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
    validateRegister, 
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateVerifyLogin
} = require('../middleware/validation');

/**
 * @route POST /auth/register
 * @description Registra un nuevo usuario (cliente)
 * @access Public
 */
router.post('/register', validateRegister, AuthController.register);

/**
 * @route POST /auth/login
 * @description Autentica las credenciales de un usuario y envía código de verificación por correo
 * @access Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route POST /auth/verify-login
 * @description Verifica el código de confirmación de identidad enviado por correo en el login
 * @access Public
 */
router.post('/verify-login', validateVerifyLogin, AuthController.verifyLogin);

/**
 * @route POST /auth/forgot-password
 * @description Envía un código de recuperación al email del usuario
 * @access Public
 */
router.post('/forgot-password', validateForgotPassword, AuthController.forgotPassword);

/**
 * @route POST /auth/reset-password
 * @description Reestablece la contraseña del usuario con un código de recuperación
 * @access Public
 */
router.post('/reset-password', validateResetPassword, AuthController.resetPassword);

/**
 * @route POST /auth/google
 * @description Inicia sesión o registra un usuario usando Google OAuth ID Token
 * @access Public
 */
router.post('/google', AuthController.googleLogin);

/**
 * @route POST /auth/push-token
 * @description Registra o actualiza el push_token de Firebase/Expo para el usuario autenticado
 * @access Private
 */
router.post('/push-token', authenticateToken, AuthController.savePushToken);
router.post('/test-push', authenticateToken, AuthController.testPush);

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
