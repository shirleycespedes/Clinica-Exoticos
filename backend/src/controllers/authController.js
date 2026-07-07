/**
 * Controlador de Autenticación
 * @description Maneja las operaciones de registro, login y autenticación
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Propietario = require('../models/Propietario');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

class AuthController {
    /**
     * Registra un nuevo usuario (cliente)
     */
    static async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { nombre, email, password, telefono, rol = 'cliente', cedula } = req.body;
            let finalRol = 'cliente';

            if (rol === 'admin') {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                if (!token) {
                    return res.status(403).json({
                        success: false,
                        message: 'No autorizado',
                        error: 'Solo los administradores pueden registrar a otros administradores'
                    });
                }
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
                    const requestingUser = await Usuario.findById(decoded.userId);
                    if (!requestingUser || requestingUser.rol !== 'admin') {
                        return res.status(403).json({
                            success: false,
                            message: 'No autorizado',
                            error: 'Se requieren permisos de administrador para crear otra cuenta de administrador'
                        });
                    }
                    finalRol = 'admin';
                } catch (err) {
                    return res.status(401).json({
                        success: false,
                        message: 'Sesión inválida o expirada',
                        error: 'Por favor inicia sesión nuevamente como administrador para realizar esta acción'
                    });
                }
            }

            const existingUser = await Usuario.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newUser = await Usuario.create({
                nombre,
                email,
                password: hashedPassword,
                telefono,
                rol: finalRol
            });


            const token = jwt.sign(
                { userId: newUser.id, email: newUser.email, rol: newUser.rol },
                process.env.JWT_SECRET || 'default_secret_key',
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.status(201).json({
                success: true,
                message: 'Usuario registrado correctamente',
                data: {
                    user: newUser,
                    token,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            });
        } catch (error) {
            console.error('Error en register:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Autentica un usuario (login)
     */
    static async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            const user = await Usuario.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Buscar si el usuario es propietario
            const propietario = await Propietario.findByUsuarioId(user.id);

            const token = jwt.sign(
                { userId: user.id, email: user.email, rol: user.rol },
                process.env.JWT_SECRET || 'default_secret_key',
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            delete user.password;

            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user: {
                        ...user,
                        propietario_id: propietario ? propietario.id : null
                    },
                    token,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                }
            });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene el perfil del usuario autenticado
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user.userId;

            const user = await Usuario.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const propietario = await Propietario.findByUsuarioId(userId);

            res.status(200).json({
                success: true,
                message: 'Perfil obtenido correctamente',
                data: {
                    ...user,
                    propietario_id: propietario ? propietario.id : null,
                    apellido: propietario ? propietario.apellido : undefined,
                    cedula: propietario ? propietario.cedula : undefined
                }
            });
        } catch (error) {
            console.error('Error en getProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene el listado de administradores (veterinarios)
     */
    static async getAdmins(req, res) {
        try {
            const admins = await Usuario.findAllAdmins();
            res.status(200).json({
                success: true,
                message: 'Administradores obtenidos correctamente',
                data: admins
            });
        } catch (error) {
            console.error('Error en getAdmins:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualiza el perfil del usuario autenticado
     */
    static async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const { nombre, email, telefono, apellido, cedula } = req.body;

            const updatedUser = await Usuario.update(userId, { nombre, email, telefono });
            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            if (updatedUser.rol === 'cliente') {
                const propietario = await Propietario.findByUsuarioId(userId);
                if (propietario) {
                    await Propietario.update(propietario.id, {
                        usuario_id: userId,
                        nombre: nombre.split(' ')[0] || nombre,
                        apellido: apellido || propietario.apellido,
                        cedula: cedula || propietario.cedula,
                        telefono: telefono,
                        email: email
                    });
                }
            }

            const finalPropietario = updatedUser.rol === 'cliente' 
                ? await Propietario.findByUsuarioId(userId)
                : null;

            res.status(200).json({
                success: true,
                message: 'Perfil actualizado correctamente',
                data: {
                    id: updatedUser.id,
                    nombre: updatedUser.nombre,
                    email: updatedUser.email,
                    telefono: updatedUser.telefono,
                    rol: updatedUser.rol,
                    propietario_id: finalPropietario ? finalPropietario.id : null,
                    apellido: finalPropietario ? finalPropietario.apellido : undefined,
                    cedula: finalPropietario ? finalPropietario.cedula : undefined
                }
            });
        } catch (error) {
            console.error('Error en updateProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Cambia la contraseña del usuario autenticado
     */
    static async changePassword(req, res) {
        try {
            const userId = req.user.userId;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña actual y la nueva contraseña son obligatorias'
                });
            }

            // Buscar el usuario por email (que está en req.user descodificado del token JWT)
            const user = await Usuario.findByEmail(req.user.email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'La contraseña actual es incorrecta'
                });
            }

            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            const updated = await Usuario.updatePassword(userId, hashedPassword);
            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: 'No se pudo actualizar la contraseña'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Contraseña actualizada correctamente'
            });
        } catch (error) {
            console.error('Error en changePassword:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async getUsers(req, res) {
        try {
            if (req.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }
            const users = await Usuario.findAll();
            const [propietarios] = await pool.execute("SELECT * FROM propietarios");
            const [pacientes] = await pool.execute("SELECT id, propietario_id, nombre, especie, tipo_animal FROM pacientes");

            const richUsers = users.map(user => {
                if (user.rol === 'cliente') {
                    const prop = propietarios.find(p => p.usuario_id === user.id);
                    if (prop) {
                        const ownerPets = pacientes.filter(p => p.propietario_id === prop.id);
                        return {
                            ...user,
                            apellido: prop.apellido,
                            cedula: prop.cedula,
                            propietario_id: prop.id,
                            mascotas: ownerPets.map(p => ({
                                id: p.id,
                                nombre: p.nombre,
                                especie: p.especie,
                                tipo_animal: p.tipo_animal
                            })),
                            mascotas_count: ownerPets.length
                        };
                    }
                }
                return {
                    ...user,
                    mascotas: [],
                    mascotas_count: 0
                };
            });

            res.status(200).json({
                success: true,
                message: 'Usuarios obtenidos correctamente',
                data: richUsers
            });
        } catch (error) {
            console.error('Error en getUsers:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Elimina un usuario por su ID (solo admin)
     */
    static async deleteUser(req, res) {
        try {
            if (req.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
            }
            const targetUserId = parseInt(req.params.id);

            if (req.user.userId === targetUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'No puedes eliminar tu propio usuario desde la lista de administración. Utiliza la opción de eliminar cuenta en tu perfil.'
                });
            }

            const targetUser = await Usuario.findById(targetUserId);
            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado.'
                });
            }

            if (targetUser.rol === 'admin') {
                const admins = await Usuario.findAllAdmins();
                if (admins.length <= 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'No se puede eliminar el último administrador del sistema.'
                    });
                }
            }

            if (targetUser.rol === 'cliente') {
                const prop = await Propietario.findByUsuarioId(targetUserId);
                if (prop) {
                    const [pacientes] = await pool.execute(
                        'SELECT COUNT(*) as total FROM pacientes WHERE propietario_id = ?',
                        [prop.id]
                    );
                    if (pacientes[0].total > 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'No se puede eliminar el cliente porque tiene mascotas registradas. Primero debes eliminar o transferir sus mascotas.'
                        });
                    }
                    await pool.execute('DELETE FROM propietarios WHERE id = ?', [prop.id]);
                }
            }

            await Usuario.delete(targetUserId);

            res.status(200).json({
                success: true,
                message: 'Usuario eliminado correctamente.'
            });
        } catch (error) {
            console.error('Error en deleteUser:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el usuario.',
                error: error.message
            });
        }
    }

    /**
     * Elimina la propia cuenta del usuario firmado
     */
    static async deleteOwnAccount(req, res) {
        try {
            const userId = req.user.userId;
            const user = await Usuario.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado.'
                });
            }

            if (user.rol === 'admin') {
                const admins = await Usuario.findAllAdmins();
                if (admins.length <= 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'No puedes eliminar tu cuenta porque eres el único administrador del sistema.'
                    });
                }
            }

            if (user.rol === 'cliente') {
                const prop = await Propietario.findByUsuarioId(userId);
                if (prop) {
                    const [pacientes] = await pool.execute(
                        'SELECT COUNT(*) as total FROM pacientes WHERE propietario_id = ?',
                        [prop.id]
                    );
                    if (pacientes[0].total > 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'No puedes eliminar tu cuenta porque tienes mascotas registradas. Primero debes eliminar tus mascotas.'
                        });
                    }
                    await pool.execute('DELETE FROM propietarios WHERE id = ?', [prop.id]);
                }
            }

            await Usuario.delete(userId);

            res.status(200).json({
                success: true,
                message: 'Tu cuenta ha sido eliminada con éxito.'
            });
        } catch (error) {
            console.error('Error en deleteOwnAccount:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar la cuenta.',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;