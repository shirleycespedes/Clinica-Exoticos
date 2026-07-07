/**
 * Controlador de Citas
 * @description Maneja todas las operaciones HTTP para la entidad Cita
 */

const Cita = require('../models/Cita');
const Paciente = require('../models/Paciente');
const Propietario = require('../models/Propietario');
const { validationResult } = require('express-validator');

class CitaController {
    /**
     * Obtiene todas las citas con paginación (solo admin)
     */
    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;

            let result;

            if (search) {
                const citas = await Cita.search(search);
                result = {
                    citas,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: citas.length,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                };
            } else {
                result = await Cita.paginate(page, limit);
            }

            res.status(200).json({
                success: true,
                message: 'Citas obtenidas correctamente',
                data: result.citas,
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
     * Obtiene las citas del propietario autenticado (cliente)
     */
    static async getMyCitas(req, res) {
        try {
            const userId = req.user.userId;

            const propietario = await Propietario.findByUsuarioId(userId);
            if (!propietario) {
                return res.status(404).json({
                    success: false,
                    message: 'No tienes un perfil de propietario asociado'
                });
            }

            const citas = await Cita.findByPropietario(propietario.id);

            res.status(200).json({
                success: true,
                message: 'Tus citas obtenidas correctamente',
                data: citas,
                count: citas.length
            });
        } catch (error) {
            console.error('Error en getMyCitas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene los horarios y fechas de todas las citas ocupadas
     */
    static async getOcupadas(req, res) {
        try {
            const ocupadas = await Cita.getOcupadas();
            res.status(200).json({
                success: true,
                message: 'Citas ocupadas obtenidas correctamente',
                data: ocupadas
            });
        } catch (error) {
            console.error('Error en getOcupadas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene una cita por ID
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

            const cita = await Cita.findById(id);

            if (!cita) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            // Si es cliente, verificar que la cita le pertenece
            if (req.user.rol === 'cliente') {
                const propietario = await Propietario.findByUsuarioId(req.user.userId);
                if (!propietario || propietario.id !== cita.propietario_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para ver esta cita'
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: 'Cita obtenida correctamente',
                data: cita
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
     * Crea una nueva cita (cliente o admin)
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

            const { paciente_id, propietario_id } = req.body;

            // Si es cliente, usar su propio propietario_id
            let propietarioId = propietario_id;
            if (req.user.rol === 'cliente') {
                const propietario = await Propietario.findByUsuarioId(req.user.userId);
                if (!propietario) {
                    return res.status(404).json({
                        success: false,
                        message: 'No tienes un perfil de propietario asociado'
                    });
                }
                propietarioId = propietario.id;
                req.body.propietario_id = propietarioId;
            }

            // Verificar que el paciente existe y pertenece al propietario
            const paciente = await Paciente.findById(paciente_id);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            if (paciente.propietario_id !== propietarioId) {
                return res.status(403).json({
                    success: false,
                    message: 'Este paciente no pertenece al propietario especificado'
                });
            }

            const newCita = await Cita.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Cita creada correctamente',
                data: newCita
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
     * Actualiza una cita existente (solo admin)
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

            const existingCita = await Cita.findById(id);
            if (!existingCita) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            const updatedCita = await Cita.update(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Cita actualizada correctamente',
                data: updatedCita
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
     * Cancela una cita (cliente o admin)
     */
    static async cancel(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const cita = await Cita.findById(id);
            if (!cita) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            // Si es cliente, verificar que la cita le pertenece
            if (req.user.rol === 'cliente') {
                const propietario = await Propietario.findByUsuarioId(req.user.userId);
                if (!propietario || propietario.id !== cita.propietario_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para cancelar esta cita'
                    });
                }
            }

            await Cita.updateEstado(id, 'cancelada');

            res.status(200).json({
                success: true,
                message: 'Cita cancelada correctamente'
            });
        } catch (error) {
            console.error('Error en cancel:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Elimina una cita (solo admin)
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

            const existingCita = await Cita.findById(id);
            if (!existingCita) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            await Cita.delete(id);

            res.status(200).json({
                success: true,
                message: 'Cita eliminada correctamente'
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
}

module.exports = CitaController;