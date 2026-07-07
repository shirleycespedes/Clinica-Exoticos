/**
 * Controlador de Propietarios
 * @description Maneja todas las operaciones HTTP para la entidad Propietario
 */

const Propietario = require('../models/Propietario');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');

class PropietarioController {
    /**
     * Obtiene todos los propietarios con paginación
     */
    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;

            let result;

            if (search) {
                const propietarios = await Propietario.search(search);
                result = {
                    propietarios,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: propietarios.length,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                };
            } else {
                result = await Propietario.paginate(page, limit);
            }

            res.status(200).json({
                success: true,
                message: 'Propietarios obtenidos correctamente',
                data: result.propietarios,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error en getAll:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene un propietario por ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const propietario = await Propietario.findById(id);

            if (!propietario) {
                return res.status(404).json({
                    success: false,
                    message: 'Propietario no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Propietario obtenido correctamente',
                data: propietario
            });
        } catch (error) {
            console.error('Error en getById:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene el propietario del usuario autenticado (cliente)
     */
    static async getMyPropietario(req, res) {
        try {
            const userId = req.user.userId;

            const propietario = await Propietario.findByUsuarioId(userId);

            if (!propietario) {
                return res.status(404).json({
                    success: false,
                    message: 'No tienes un perfil de propietario asociado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Propietario obtenido correctamente',
                data: propietario
            });
        } catch (error) {
            console.error('Error en getMyPropietario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Crea un nuevo propietario (solo admin)
     */
    static async create(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { cedula, email } = req.body;

            // Verificar si la cédula ya existe
            const existingCedula = await Propietario.findByCedula(cedula);
            if (existingCedula) {
                return res.status(409).json({
                    success: false,
                    message: 'La cédula ya está registrada'
                });
            }

            // Si hay email, verificar que el usuario existe
            if (email) {
                const user = await Usuario.findByEmail(email);
                if (user) {
                    // Verificar si el usuario ya tiene un propietario asociado
                    const existingPropietario = await Propietario.findByUsuarioId(user.id);
                    if (existingPropietario) {
                        return res.status(409).json({
                            success: false,
                            message: 'El usuario ya tiene un propietario asociado'
                        });
                    }
                    req.body.usuario_id = user.id;
                }
            }

            const newPropietario = await Propietario.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Propietario creado correctamente',
                data: newPropietario
            });
        } catch (error) {
            console.error('Error en create:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Actualiza un propietario existente
     */
    static async update(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const existingPropietario = await Propietario.findById(id);
            if (!existingPropietario) {
                return res.status(404).json({
                    success: false,
                    message: 'Propietario no encontrado'
                });
            }

            // Verificar si la cédula ya existe en otro propietario
            const { cedula } = req.body;
            if (cedula && cedula !== existingPropietario.cedula) {
                const cedulaUser = await Propietario.findByCedula(cedula);
                if (cedulaUser && cedulaUser.id !== parseInt(id)) {
                    return res.status(409).json({
                        success: false,
                        message: 'La cédula ya está registrada en otro propietario'
                    });
                }
            }

            const updatedPropietario = await Propietario.update(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Propietario actualizado correctamente',
                data: updatedPropietario
            });
        } catch (error) {
            console.error('Error en update:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Elimina un propietario (solo admin)
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const existingPropietario = await Propietario.findById(id);
            if (!existingPropietario) {
                return res.status(404).json({
                    success: false,
                    message: 'Propietario no encontrado'
                });
            }

            await Propietario.delete(id);

            res.status(200).json({
                success: true,
                message: 'Propietario eliminado correctamente'
            });
        } catch (error) {
            console.error('Error en delete:', error);
            
            if (error.message.includes('pacientes asociados')) {
                return res.status(409).json({
                    success: false,
                    message: 'No se puede eliminar el propietario porque tiene pacientes asociados'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Busca propietarios por término
     */
    static async search(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro de búsqueda es requerido'
                });
            }

            const propietarios = await Propietario.search(q.trim());

            res.status(200).json({
                success: true,
                message: 'Búsqueda completada',
                data: propietarios,
                count: propietarios.length
            });
        } catch (error) {
            console.error('Error en search:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = PropietarioController;