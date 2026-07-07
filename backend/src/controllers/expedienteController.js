/**
 * Controlador de Expedientes
 * @description Maneja todas las operaciones HTTP para la entidad Expediente
 */

const Expediente = require('../models/Expediente');
const Paciente = require('../models/Paciente');
const Propietario = require('../models/Propietario');
const { validationResult } = require('express-validator');

class ExpedienteController {
    /**
     * Obtiene el expediente de un paciente
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

            // Si es cliente, verificar que el paciente le pertenece
            if (req.user.rol === 'cliente') {
                const propietario = await Propietario.findByUsuarioId(req.user.userId);
                if (!propietario || propietario.id !== paciente.propietario_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para ver este expediente'
                    });
                }
            }

            const expediente = await Expediente.findByPacienteId(pacienteId);

            if (!expediente) {
                return res.status(404).json({
                    success: false,
                    message: 'El paciente no tiene un expediente activo'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Expediente obtenido correctamente',
                data: expediente
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

    /**
     * Crea un expediente para un paciente (solo admin)
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

            const { paciente_id } = req.body;

            const paciente = await Paciente.findById(paciente_id);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            // Verificar si ya tiene un expediente activo
            const existingExpediente = await Expediente.findByPacienteId(paciente_id);
            if (existingExpediente) {
                return res.status(409).json({
                    success: false,
                    message: 'El paciente ya tiene un expediente activo'
                });
            }

            const newExpediente = await Expediente.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Expediente creado correctamente',
                data: newExpediente
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
     * Actualiza un expediente existente (solo admin)
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

            const existingExpediente = await Expediente.findById(id);
            if (!existingExpediente) {
                return res.status(404).json({
                    success: false,
                    message: 'Expediente no encontrado'
                });
            }

            const updatedExpediente = await Expediente.update(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Expediente actualizado correctamente',
                data: updatedExpediente
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
     * Cierra un expediente (solo admin)
     */
    static async cerrar(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const expediente = await Expediente.findById(id);
            if (!expediente) {
                return res.status(404).json({
                    success: false,
                    message: 'Expediente no encontrado'
                });
            }

            if (expediente.fecha_cierre) {
                return res.status(400).json({
                    success: false,
                    message: 'El expediente ya está cerrado'
                });
            }

            await Expediente.cerrar(id, new Date().toISOString().split('T')[0]);

            const expedienteActualizado = await Expediente.findById(id);

            res.status(200).json({
                success: true,
                message: 'Expediente cerrado correctamente',
                data: expedienteActualizado
            });
        } catch (error) {
            console.error('Error en cerrar:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Elimina un expediente por ID (solo admin)
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;

            const expediente = await Expediente.findById(id);
            if (!expediente) {
                return res.status(404).json({
                    success: false,
                    message: 'Expediente no encontrado'
                });
            }

            const deleted = await Expediente.delete(id);
            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'No se pudo eliminar el expediente'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Expediente eliminado correctamente'
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

module.exports = ExpedienteController;