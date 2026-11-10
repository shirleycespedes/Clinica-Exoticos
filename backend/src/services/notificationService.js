/**
 * Servicio de Notificaciones Push con Firebase (FCM), Expo y Web
 * @description Maneja el envío de notificaciones push utilizando Firebase Cloud Messaging (firebase-admin),
 * Expo Push API, persistencia en base de datos y Web Push.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { pool } = require('../config/database');
const Notificacion = require('../models/Notificacion');

let firebaseApp = null;
let firebaseMessaging = null;
let firebaseInitialized = false;

// Intentar inicializar Firebase Admin SDK si existe la clave de cuenta de servicio (archivo o variable de entorno)
try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                               path.join(__dirname, '../../firebase-service-account.json');

    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
            serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT_JSON === 'object'
                ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON
                : JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        } catch (e) {
            console.warn('Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
        }
    } else if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
    }

    if (serviceAccount) {
        const { initializeApp, cert } = require('firebase-admin/app');
        const { getMessaging } = require('firebase-admin/messaging');

        firebaseApp = initializeApp({
            credential: cert(serviceAccount)
        });
        firebaseMessaging = getMessaging(firebaseApp);
        firebaseInitialized = true;
        console.log('🔥 Firebase Admin SDK inicializado correctamente para Notificaciones Push.');
    } else {
        console.log('ℹ️ Firebase service account no encontrada. Modo demostración/consola activo para notificaciones.');
    }
} catch (err) {
    console.warn('⚠️ No se pudo inicializar Firebase Admin SDK:', err.message);
}

class NotificationService {
    /**
     * Guarda o actualiza el push_token de un usuario en la base de datos
     * @param {number} userId 
     * @param {string} pushToken 
     */
    static async saveUserToken(userId, pushToken) {
        try {
            await pool.execute(
                'UPDATE usuarios SET push_token = ? WHERE id = ?',
                [pushToken, userId]
            );
            return true;
        } catch (error) {
            console.error('Error al guardar push_token:', error);
            throw error;
        }
    }

    /**
     * Obtiene el push_token de un usuario por su ID
     * @param {number} userId 
     * @returns {Promise<string|null>}
     */
    static async getUserToken(userId) {
        try {
            const [rows] = await pool.execute(
                'SELECT push_token FROM usuarios WHERE id = ?',
                [userId]
            );
            return rows.length > 0 ? rows[0].push_token : null;
        } catch (error) {
            console.error('Error al obtener push_token:', error);
            return null;
        }
    }

    /**
     * Envía una notificación push a un token
     * @param {string} pushToken 
     * @param {Object} payload { title, body, data }
     */
    static async sendPushNotification(pushToken, { title, body, data = {} }) {
        console.log('====================================================');
        console.log('📢 [NOTIFICACIÓN PUSH GENERADA - VETEXÓTICOS]');
        console.log(`📱 Token: ${pushToken || 'Sin token nativo registrado (Web / In-App)'}`);
        console.log(`📌 Título: ${title}`);
        console.log(`💬 Mensaje: ${body}`);
        console.log(`📦 Datos:`, JSON.stringify(data));
        console.log('====================================================');

        if (!pushToken) {
            return { success: true, delivered: 'database_only', message: 'Notificación almacenada en bandeja' };
        }

        // Si es un token de navegador Web
        if (pushToken.startsWith('web-token-') || pushToken.startsWith('web-browser-')) {
            return { success: true, delivered: 'web_browser', token: pushToken };
        }

        // 1. Si es un token de Expo (comienza con ExponentPushToken o ExpoPushToken)
        if (pushToken.startsWith('ExponentPushToken[') || pushToken.startsWith('ExpoPushToken[')) {
            return await this.sendExpoPush(pushToken, { title, body, data });
        }

        // 2. Si Firebase Admin SDK está activo y es un token FCM nativo
        if (firebaseInitialized && firebaseMessaging) {
            try {
                const message = {
                    token: pushToken,
                    notification: {
                        title,
                        body
                    },
                    data: Object.fromEntries(
                        Object.entries(data).map(([k, v]) => [k, String(v)])
                    )
                };

                const response = await firebaseMessaging.send(message);
                console.log('✅ Notificación FCM enviada con éxito id:', response);
                return { success: true, messageId: response };
            } catch (fcmError) {
                console.error('❌ Error al enviar notificación con Firebase Admin:', fcmError.message);
                return { success: false, error: fcmError.message };
            }
        }

        // Modo desarrollo / fallback exitoso
        return { success: true, simulated: true };
    }

    /**
     * Envía notificación a través del servicio de Expo Push API
     */
    static async sendExpoPush(pushToken, { title, body, data }) {
        return new Promise((resolve) => {
            const messageData = JSON.stringify({
                to: pushToken,
                sound: 'default',
                title,
                body,
                data
            });

            const options = {
                hostname: 'exp.host',
                path: '/--/api/v2/push/send',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(messageData)
                }
            };

            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => { responseBody += chunk; });
                res.on('end', () => {
                    console.log('📱 Respuesta Expo Push API:', responseBody);
                    resolve({ success: true, response: responseBody });
                });
            });

            req.on('error', (e) => {
                console.warn('⚠️ Error enviando a Expo Push API:', e.message);
                resolve({ success: false, error: e.message });
            });

            req.write(messageData);
            req.end();
        });
    }

    // =========================================================================
    // LAS 3 NOTIFICACIONES PUSH OBLIGATORIAS DEL SISTEMA:
    // =========================================================================

    /**
     * NOTIFICACIÓN 1: Cita Médica Confirmada
     * Se dispara cuando el veterinario confirma la cita o le asigna doctor.
     */
    static async notifyCitaConfirmada({ usuarioId, pacienteNombre, fecha, hora, veterinario, citaId }) {
        try {
            const title = '📅 Cita Confirmada - VetExóticos';
            const body = `¡Tu cita para ${pacienteNombre} el ${fecha} a las ${hora} ha sido confirmada con ${veterinario || 'el veterinario'}!`;
            const data = {
                tipo: 'CITA_CONFIRMADA',
                screen: 'Citas',
                citaId: citaId ? String(citaId) : ''
            };

            // Guardar en la bandeja de notificaciones del usuario
            await Notificacion.create({
                usuario_id: usuarioId,
                titulo: title,
                mensaje: body,
                tipo: 'CITA_CONFIRMADA',
                data
            });

            const token = await this.getUserToken(usuarioId);
            return await this.sendPushNotification(token, { title, body, data });
        } catch (error) {
            console.error('Error en notifyCitaConfirmada:', error);
        }
    }

    /**
     * NOTIFICACIÓN 2: Pedido Listo para Retiro
     * Se dispara cuando el estado del pedido de tienda cambia a "listo".
     */
    static async notifyPedidoListo({ usuarioId, codigoRetiro, pedidoId }) {
        try {
            const title = '🛍️ ¡Tu pedido está listo! - VetExóticos';
            const body = `Tu pedido #${codigoRetiro} ya está empacado y listo para ser retirado en la clínica veterinaria.`;
            const data = {
                tipo: 'PEDIDO_LISTO',
                screen: 'Tienda',
                pedidoId: pedidoId ? String(pedidoId) : '',
                codigoRetiro
            };

            await Notificacion.create({
                usuario_id: usuarioId,
                titulo: title,
                mensaje: body,
                tipo: 'PEDIDO_LISTO',
                data
            });

            const token = await this.getUserToken(usuarioId);
            return await this.sendPushNotification(token, { title, body, data });
        } catch (error) {
            console.error('Error en notifyPedidoListo:', error);
        }
    }

    /**
     * NOTIFICACIÓN 3: Nueva Consulta Médica Registrada en Expediente
     * Se dispara cuando el veterinario agrega una consulta o informe médico.
     */
    static async notifyNuevaConsulta({ usuarioId, pacienteNombre, veterinario, motivo, consultaId }) {
        try {
            const title = '🩺 Nueva Consulta Médica - VetExóticos';
            const body = `El Dr. ${veterinario || 'Veterinario'} ha registrado una nueva consulta médica para ${pacienteNombre}: "${motivo}".`;
            const data = {
                tipo: 'NUEVA_CONSULTA',
                screen: 'Consultas',
                consultaId: consultaId ? String(consultaId) : ''
            };

            await Notificacion.create({
                usuario_id: usuarioId,
                titulo: title,
                mensaje: body,
                tipo: 'NUEVA_CONSULTA',
                data
            });

            const token = await this.getUserToken(usuarioId);
            return await this.sendPushNotification(token, { title, body, data });
        } catch (error) {
            console.error('Error en notifyNuevaConsulta:', error);
        }
    }

    /**
     * NOTIFICACIÓN ADICIONAL: Pedido Recibido / Registrado
     */
    static async notifyPedidoRecibido({ usuarioId, codigoRetiro, total, pedidoId }) {
        try {
            const title = '📦 Pedido Recibido - VetExóticos';
            const body = `Hemos recibido tu pedido #${codigoRetiro} (₡${parseFloat(total).toLocaleString()}). Te avisaremos cuando esté listo.`;
            const data = {
                tipo: 'PEDIDO_RECIBIDO',
                screen: 'Tienda',
                pedidoId: pedidoId ? String(pedidoId) : ''
            };

            await Notificacion.create({
                usuario_id: usuarioId,
                titulo: title,
                mensaje: body,
                tipo: 'PEDIDO_RECIBIDO',
                data
            });

            const token = await this.getUserToken(usuarioId);
            return await this.sendPushNotification(token, { title, body, data });
        } catch (error) {
            console.error('Error en notifyPedidoRecibido:', error);
        }
    }

    /**
     * Enviar notificación a todos los administradores registrados
     */
    static async notifyAllAdmins({ title, body, data = {} }) {
        try {
            const [admins] = await pool.execute(
                "SELECT id, push_token FROM usuarios WHERE rol = 'admin'"
            );
            const promises = admins.map(async (adm) => {
                await Notificacion.create({
                    usuario_id: adm.id,
                    titulo: title,
                    mensaje: body,
                    tipo: data.tipo || 'ADMIN_ALERTA',
                    data
                });
                if (adm.push_token) {
                    return await this.sendPushNotification(adm.push_token, { title, body, data });
                }
            });
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error en notifyAllAdmins:', error);
        }
    }

    /**
     * Enviar notificación a todos los clientes registrados
     */
    static async notifyAllClients({ title, body, data = {} }) {
        try {
            const [clientes] = await pool.execute(
                "SELECT id, push_token FROM usuarios WHERE rol = 'cliente'"
            );
            const promises = clientes.map(async (cli) => {
                await Notificacion.create({
                    usuario_id: cli.id,
                    titulo: title,
                    mensaje: body,
                    tipo: data.tipo || 'CLIENTE_ALERTA',
                    data
                });
                if (cli.push_token) {
                    return await this.sendPushNotification(cli.push_token, { title, body, data });
                }
            });
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error en notifyAllClients:', error);
        }
    }

    /**
     * NOTIFICACIÓN: Cita Creada / Solicitada
     */
    static async notifyCitaCreada({ usuarioId, pacienteNombre, fecha, hora, citaId }) {
        try {
            const title = '📅 Cita Solicitada - VetExóticos';
            const body = `Tu cita para ${pacienteNombre} el ${fecha} a las ${hora} ha sido agendada con éxito.`;
            const data = {
                tipo: 'CITA_CREADA',
                screen: 'Citas',
                citaId: citaId ? String(citaId) : ''
            };

            await Notificacion.create({
                usuario_id: usuarioId,
                titulo: title,
                mensaje: body,
                tipo: 'CITA_CREADA',
                data
            });

            const token = await this.getUserToken(usuarioId);
            return await this.sendPushNotification(token, { title, body, data });
        } catch (error) {
            console.error('Error en notifyCitaCreada:', error);
        }
    }

    /**
     * NOTIFICACIÓN: Cambio de Estado de Pedido para el Cliente
     */
    static async notifyPedidoEstado({ usuarioId, codigoRetiro, estado, pedidoId }) {
        try {
            const title = '🛍️ Actualización de Pedido - VetExóticos';
            const body = `Tu pedido #${codigoRetiro} cambió de estado a: "${estado.toUpperCase()}".`;
            const data = {
                tipo: 'PEDIDO_ESTADO_CAMBIADO',
                screen: 'Tienda',
                pedidoId: pedidoId ? String(pedidoId) : '',
                codigoRetiro
            };

            await Notificacion.create({
                usuario_id: usuarioId,
                titulo: title,
                mensaje: body,
                tipo: 'PEDIDO_ESTADO_CAMBIADO',
                data
            });

            const token = await this.getUserToken(usuarioId);
            return await this.sendPushNotification(token, { title, body, data });
        } catch (error) {
            console.error('Error en notifyPedidoEstado:', error);
        }
    }

    /**
     * NOTIFICACIÓN: Consulta Médica Actualizada / Editada
     */
    static async notifyConsultaActualizada({ usuarioId, pacienteNombre, veterinario, motivo, consultaId }) {
        try {
            const title = '🩺 Consulta Médica Actualizada - VetExóticos';
            const body = `La consulta médica de ${pacienteNombre} ha sido actualizada con nuevas indicaciones por Dr. ${veterinario || 'Veterinario'}.`;
            const data = {
                tipo: 'CONSULTA_ACTUALIZADA',
                screen: 'Consultas',
                consultaId: consultaId ? String(consultaId) : ''
            };

            await Notificacion.create({
                usuario_id: usuarioId,
                titulo: title,
                mensaje: body,
                tipo: 'CONSULTA_ACTUALIZADA',
                data
            });

            const token = await this.getUserToken(usuarioId);
            return await this.sendPushNotification(token, { title, body, data });
        } catch (error) {
            console.error('Error en notifyConsultaActualizada:', error);
        }
    }

    /**
     * NOTIFICACIÓN: Paciente Registrado o Actualizado
     */
    static async notifyPacienteGuardado({ usuarioId, pacienteNombre, especie, accion = 'creado', pacienteId }) {
        try {
            const title = `🦎 Paciente ${accion === 'creado' ? 'Registrado' : 'Actualizado'} - VetExóticos`;
            const body = `El paciente ${pacienteNombre} (${especie}) ha sido ${accion === 'creado' ? 'registrado exitosamente' : 'actualizado'} en el sistema.`;
            const data = {
                tipo: 'PACIENTE_GUARDADO',
                screen: 'Mascotas',
                pacienteId: pacienteId ? String(pacienteId) : ''
            };

            await Notificacion.create({
                usuario_id: usuarioId,
                titulo: title,
                mensaje: body,
                tipo: 'PACIENTE_GUARDADO',
                data
            });

            const token = await this.getUserToken(usuarioId);
            return await this.sendPushNotification(token, { title, body, data });
        } catch (error) {
            console.error('Error en notifyPacienteGuardado:', error);
        }
    }

    /**
     * NOTIFICACIÓN: Expediente Clínico Creado o Actualizado
     */
    static async notifyExpedienteGuardado({ usuarioId, numeroExpediente, pacienteNombre, accion = 'creado', expedienteId }) {
        try {
            const title = `📋 Expediente Clínico ${accion === 'creado' ? 'Creado' : 'Actualizado'} - VetExóticos`;
            const body = `El expediente #${numeroExpediente || expedienteId} (${pacienteNombre}) ha sido ${accion === 'creado' ? 'aperturado' : 'actualizado'} correctamente.`;
            const data = {
                tipo: 'EXPEDIENTE_GUARDADO',
                screen: 'Expedientes',
                expedienteId: expedienteId ? String(expedienteId) : ''
            };

            await Notificacion.create({
                usuario_id: usuarioId,
                titulo: title,
                mensaje: body,
                tipo: 'EXPEDIENTE_GUARDADO',
                data
            });

            const token = await this.getUserToken(usuarioId);
            return await this.sendPushNotification(token, { title, body, data });
        } catch (error) {
            console.error('Error en notifyExpedienteGuardado:', error);
        }
    }

    /**
     * NOTIFICACIÓN: Nuevo Administrador Registrado
     */
    static async notifyNuevoAdminRegistrado({ adminNombre, adminEmail }) {
        try {
            const title = '🛡️ Nuevo Administrador Registrado - VetExóticos';
            const body = `Se ha registrado una nueva cuenta de administrador para ${adminNombre} (${adminEmail}) en el sistema.`;
            const data = {
                tipo: 'NUEVO_ADMIN',
                screen: 'Usuarios'
            };

            return await this.notifyAllAdmins({ title, body, data });
        } catch (error) {
            console.error('Error en notifyNuevoAdminRegistrado:', error);
        }
    }

    // =========================================================================
    // TRIGGERS DE PRUEBA RÁPIDA (Permiten simular las 3 notificaciones)
    // =========================================================================

    static async testCitaConfirmada(usuarioId) {
        return await this.notifyCitaConfirmada({
            usuarioId,
            pacienteNombre: 'Iguana Verde (Draco)',
            fecha: new Date().toLocaleDateString('es-CR'),
            hora: '10:30 AM',
            veterinario: 'Dra. Sofía Mora',
            citaId: 1
        });
    }

    static async testPedidoListo(usuarioId) {
        return await this.notifyPedidoListo({
            usuarioId,
            codigoRetiro: 'VET-883921',
            pedidoId: 1
        });
    }

    static async testNuevaConsulta(usuarioId) {
        return await this.notifyNuevaConsulta({
            usuarioId,
            pacienteNombre: 'Iguana Verde (Draco)',
            veterinario: 'Dr. Alejandro Peña',
            motivo: 'Control de muda y suplemento vitamínico',
            consultaId: 1
        });
    }
}

module.exports = NotificationService;
