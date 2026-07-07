/**
 * Controlador de Pacientes
 * @description Maneja todas las operaciones HTTP para la entidad Paciente
 */

const Paciente = require('../models/Paciente');
const Propietario = require('../models/Propietario');
const Expediente = require('../models/Expediente');
const { validationResult } = require('express-validator');

class PacienteController {
    /**
     * Obtiene todos los pacientes con paginación
     */
    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;

            let result;

            if (search) {
                const pacientes = await Paciente.search(search);
                result = {
                    pacientes,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: pacientes.length,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                };
            } else {
                result = await Paciente.paginate(page, limit);
            }

            res.status(200).json({
                success: true,
                message: 'Pacientes obtenidos correctamente',
                data: result.pacientes,
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
     * Obtiene los pacientes del propietario autenticado (cliente)
     */
    static async getMyPacientes(req, res) {
        try {
            const userId = req.user.userId;

            const propietario = await Propietario.findByUsuarioId(userId);
            if (!propietario) {
                return res.status(404).json({
                    success: false,
                    message: 'No tienes un perfil de propietario asociado'
                });
            }

            const pacientes = await Paciente.findByPropietario(propietario.id);

            res.status(200).json({
                success: true,
                message: 'Tus pacientes obtenidos correctamente',
                data: pacientes,
                count: pacientes.length
            });
        } catch (error) {
            console.error('Error en getMyPacientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene un paciente por ID
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

            const paciente = await Paciente.findById(id);

            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            // Si es cliente, verificar que el paciente le pertenece
            if (req.user.rol === 'cliente') {
                const propietario = await Propietario.findByUsuarioId(req.user.userId);
                if (!propietario || propietario.id !== paciente.propietario_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para ver este paciente'
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: 'Paciente obtenido correctamente',
                data: paciente
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
     * Obtiene pacientes por propietario (solo admin)
     */
    static async getByPropietario(req, res) {
        try {
            const { propietarioId } = req.params;

            if (isNaN(propietarioId)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del propietario debe ser un número válido'
                });
            }

            const propietario = await Propietario.findById(propietarioId);
            if (!propietario) {
                return res.status(404).json({
                    success: false,
                    message: 'Propietario no encontrado'
                });
            }

            const pacientes = await Paciente.findByPropietario(propietarioId);

            res.status(200).json({
                success: true,
                message: 'Pacientes del propietario obtenidos correctamente',
                data: pacientes,
                count: pacientes.length
            });
        } catch (error) {
            console.error('Error en getByPropietario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Crea un nuevo paciente (solo admin)
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

            const { propietario_id } = req.body;

            const propietario = await Propietario.findById(propietario_id);
            if (!propietario) {
                return res.status(404).json({
                    success: false,
                    message: 'Propietario no encontrado'
                });
            }

            const newPaciente = await Paciente.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Paciente creado correctamente',
                data: newPaciente
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
     * Actualiza un paciente existente (solo admin)
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

            const existingPaciente = await Paciente.findById(id);
            if (!existingPaciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            const updatedPaciente = await Paciente.update(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Paciente actualizado correctamente',
                data: updatedPaciente
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

    static async delete(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const existingPaciente = await Paciente.findById(id);
            if (!existingPaciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            // Validar si el usuario es dueño del paciente
            if (req.user.rol === 'cliente') {
                const propietario = await Propietario.findByUsuarioId(req.user.userId);
                if (!propietario || existingPaciente.propietario_id !== propietario.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para eliminar este paciente'
                    });
                }
            }

            await Paciente.delete(id);

            res.status(200).json({
                success: true,
                message: 'Paciente eliminado correctamente'
            });
        } catch (error) {
            console.error('Error en delete:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Busca pacientes por término
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

            const pacientes = await Paciente.search(q.trim());

            res.status(200).json({
                success: true,
                message: 'Búsqueda completada',
                data: pacientes,
                count: pacientes.length
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

module.exports = PacienteController;