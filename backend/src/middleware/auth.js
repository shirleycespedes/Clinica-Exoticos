/**
 * Middleware de Autenticación JWT
 * @description Middleware para verificar y validar tokens JWT
 */

const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        let token = authHeader && authHeader.split(' ')[1];

        // Permitir autenticación por query parameter para descargas directas de archivos
        if (!token && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido',
                error: 'No se proporcionó token de autenticación'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');

        const user = await Usuario.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'El usuario asociado al token no existe'
            });
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            rol: user.rol
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
                error: 'El token proporcionado no es válido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado',
                error: 'El token ha expirado, por favor inicia sesión nuevamente'
            });
        }

        console.error('Error en authenticateToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Error de autenticación',
            error: 'Error interno del servidor'
        });
    }
};

/**
 * Middleware para verificar que el usuario es administrador
 */
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticación requerida'
        });
    }

    if (req.user.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado',
            error: 'Se requieren permisos de administrador'
        });
    }

    next();
};

/**
 * Middleware para verificar que el usuario es cliente o admin
 */
const authorizeClienteOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticación requerida'
        });
    }

    if (req.user.rol !== 'cliente' && req.user.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado',
            error: 'Se requieren permisos de cliente o administrador'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeClienteOrAdmin
};