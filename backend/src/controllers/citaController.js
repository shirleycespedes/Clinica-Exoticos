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

            // Notificaciones de Cita Creada / Solicitada
            try {
                const NotificationService = require('../services/notificationService');
                const prop = await Propietario.findById(propietarioId);
                const horaStr = (req.body.hora_cita || '').substring(0, 5);

                // Notificar al cliente dueño de la mascota
                if (prop && prop.usuario_id) {
                    NotificationService.notifyCitaCreada({
                        usuarioId: prop.usuario_id,
                        pacienteNombre: paciente.nombre,
                        fecha: req.body.fecha_cita,
                        hora: horaStr,
                        citaId: newCita.id
                    }).catch(e => console.error('Error push cita creada cliente:', e));
                }

                // Notificar a TODOS los administradores
                NotificationService.notifyAllAdmins({
                    title: '📅 Nueva Cita Agendada - VetExóticos',
                    body: `Se ha agendado una cita para ${paciente.nombre} (${prop ? prop.nombre : 'Cliente'}) el ${req.body.fecha_cita} a las ${horaStr}.`,
                    data: {
                        tipo: 'NUEVA_CITA_ADMIN',
                        screen: 'Citas',
                        citaId: String(newCita.id)
                    }
                }).catch(e => console.error('Error push nueva cita a admins:', e));
            } catch (notifErr) {
                console.warn('Error al procesar notificación de nueva cita:', notifErr.message);
            }

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

            // Notificación Push 1: Cita Confirmada
            if (req.body.estado === 'confirmada' || (req.body.veterinario_asignado && req.body.estado !== 'cancelada')) {
                try {
                    const NotificationService = require('../services/notificationService');
                    const prop = await Propietario.findById(existingCita.propietario_id);
                    const pac = await Paciente.findById(existingCita.paciente_id);
                    const rawDate = new Date(req.body.fecha_cita || existingCita.fecha_cita);
                    const fechaFormateada = !isNaN(rawDate) ? rawDate.toISOString().split('T')[0] : (req.body.fecha_cita || existingCita.fecha_cita);
                    const horaFormateada = (req.body.hora_cita || existingCita.hora_cita || '').substring(0, 5);
                    const pacienteNombre = pac ? pac.nombre : 'tu mascota';
                    const vetNombre = req.body.veterinario_asignado || existingCita.veterinario_asignado;

                    // 1. Notificar al Cliente (dueño de la mascota)
                    if (prop && prop.usuario_id) {
                        NotificationService.notifyCitaConfirmada({
                            usuarioId: prop.usuario_id,
                            pacienteNombre,
                            fecha: fechaFormateada,
                            hora: horaFormateada,
                            veterinario: vetNombre,
                            citaId: id
                        }).catch(e => console.error('Error enviando push cita confirmada al cliente:', e));
                    }

                    // 2. Notificar a TODOS los administradores
                    NotificationService.notifyAllAdmins({
                        title: '📅 Cita Médica Confirmada - VetExóticos',
                        body: `La cita de ${pacienteNombre} para el ${fechaFormateada} a las ${horaFormateada} ha sido confirmada con ${vetNombre || 'el veterinario'}.`,
                        data: {
                            tipo: 'CITA_CONFIRMADA_ADMIN',
                            screen: 'Citas',
                            citaId: String(id)
                        }
                    }).catch(e => console.error('Error enviando push cita confirmada a admins:', e));
                } catch (notifErr) {
                    console.warn('Error al procesar notificación de cita:', notifErr.message);
                }
            }

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