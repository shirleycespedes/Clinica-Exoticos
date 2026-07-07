/**
 * Controlador de Consultas
 * @description Maneja todas las operaciones HTTP para la entidad Consulta
 */

const Consulta = require('../models/Consulta');
const Expediente = require('../models/Expediente');
const Paciente = require('../models/Paciente');
const Propietario = require('../models/Propietario');
const { validationResult } = require('express-validator');

class ConsultaController {
    /**
     * Obtiene todas las consultas con paginación (solo admin)
     */
    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;

            let result;

            if (search) {
                const consultas = await Consulta.search(search);
                result = {
                    consultas,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: consultas.length,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                };
            } else {
                result = await Consulta.paginate(page, limit);
            }

            res.status(200).json({
                success: true,
                message: 'Consultas obtenidas correctamente',
                data: result.consultas,
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
     * Obtiene las consultas del paciente del propietario autenticado (cliente)
     */
    static async getMyConsultas(req, res) {
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
            let todasConsultas = [];

            for (const paciente of pacientes) {
                const consultas = await Consulta.findByPaciente(paciente.id);
                todasConsultas = [...todasConsultas, ...consultas];
            }

            // Ordenar por fecha descendente
            todasConsultas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            res.status(200).json({
                success: true,
                message: 'Tus consultas obtenidas correctamente',
                data: todasConsultas,
                count: todasConsultas.length
            });
        } catch (error) {
            console.error('Error en getMyConsultas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene una consulta por ID
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

            const consulta = await Consulta.findById(id);

            if (!consulta) {
                return res.status(404).json({
                    success: false,
                    message: 'Consulta no encontrada'
                });
            }

            // Si es cliente, verificar que la consulta le pertenece
            if (req.user.rol === 'cliente') {
                const propietario = await Propietario.findByUsuarioId(req.user.userId);
                if (!propietario || propietario.id !== consulta.propietario_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para ver esta consulta'
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: 'Consulta obtenida correctamente',
                data: consulta
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
     * Obtiene consultas por expediente
     */
    static async getByExpediente(req, res) {
        try {
            const { expedienteId } = req.params;

            if (isNaN(expedienteId)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del expediente debe ser un número válido'
                });
            }

            const expediente = await Expediente.findById(expedienteId);
            if (!expediente) {
                return res.status(404).json({
                    success: false,
                    message: 'Expediente no encontrado'
                });
            }

            // Si es cliente, verificar que el expediente le pertenece
            if (req.user.rol === 'cliente') {
                const paciente = await Paciente.findById(expediente.paciente_id);
                if (!paciente) {
                    return res.status(404).json({
                        success: false,
                        message: 'Paciente no encontrado'
                    });
                }
                const propietario = await Propietario.findByUsuarioId(req.user.userId);
                if (!propietario || propietario.id !== paciente.propietario_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para ver estas consultas'
                    });
                }
            }

            const consultas = await Consulta.findByExpediente(expedienteId);

            res.status(200).json({
                success: true,
                message: 'Consultas del expediente obtenidas correctamente',
                data: consultas,
                count: consultas.length
            });
        } catch (error) {
            console.error('Error en getByExpediente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Crea una nueva consulta (solo admin)
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

            const { expediente_id } = req.body;

            const expediente = await Expediente.findById(expediente_id);
            if (!expediente) {
                return res.status(404).json({
                    success: false,
                    message: 'Expediente no encontrado'
                });
            }

            const newConsulta = await Consulta.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Consulta creada correctamente',
                data: newConsulta
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
     * Actualiza una consulta existente (solo admin)
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

            const existingConsulta = await Consulta.findById(id);
            if (!existingConsulta) {
                return res.status(404).json({
                    success: false,
                    message: 'Consulta no encontrada'
                });
            }

            const updatedConsulta = await Consulta.update(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Consulta actualizada correctamente',
                data: updatedConsulta
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
     * Elimina una consulta (solo admin)
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

            const existingConsulta = await Consulta.findById(id);
            if (!existingConsulta) {
                return res.status(404).json({
                    success: false,
                    message: 'Consulta no encontrada'
                });
            }

            await Consulta.delete(id);

            res.status(200).json({
                success: true,
                message: 'Consulta eliminada correctamente'
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
     * Obtiene consultas por paciente
     */
    static async getByPaciente(req, res) {
        try {
            const { pacienteId } = req.params;

            if (isNaN(pacienteId)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID del paciente debe ser un número válido'
                });
            }

            const paciente = await Paciente.findById(pacienteId);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            if (req.user.rol === 'cliente') {
                const propietario = await Propietario.findByUsuarioId(req.user.userId);
                if (!propietario || propietario.id !== paciente.propietario_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para ver estas consultas'
                    });
                }
            }

            const consultas = await Consulta.findByPaciente(pacienteId);

            res.status(200).json({
                success: true,
                message: 'Consultas del paciente obtenidas correctamente',
                data: consultas,
                count: consultas.length
            });
        } catch (error) {
            console.error('Error en getByPaciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = ConsultaController;