import { Platform } from 'react-native';
import api from './api';

// Configuración de cómo se comportan las notificaciones cuando la app está en primer plano (sólo dispositivos móviles)
if (Platform.OS !== 'web') {
    try {
        const Notifications = require('expo-notifications');
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
    } catch (err) {
        console.warn('[Push] Error al configurar handler de notificaciones:', err);
    }
}

/**
 * Muestra una notificación visual en el sistema (Web / Desktop / Móvil)
 */
export function displaySystemNotification(title, body, data = {}) {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
        if (window.Notification.permission === 'granted') {
            try {
                const notif = new window.Notification(title, {
                    body,
                    icon: '/favicon.png',
                    data
                });
                notif.onclick = () => {
                    window.focus();
                    if (data?.screen && window.__appNavigationRef && window.__appNavigationRef.isReady()) {
                        window.__appNavigationRef.navigate(data.screen, data.params || {});
                    }
                };
            } catch (err) {
                console.warn('[Web Push] Error mostrando notificación de navegador:', err);
            }
        }
    } else if (Platform.OS !== 'web') {
        try {
            const Notifications = require('expo-notifications');
            Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: true
                },
                trigger: null
            });
        } catch (err) {
            console.warn('[Push] Error mostrando notificación local:', err);
        }
    }
}

/**
 * Registra el dispositivo para recibir notificaciones push y envía el token al backend
 */
export async function registerForPushNotificationsAsync() {
    let token = null;

    // En web: registrar un token real de Firebase Cloud Messaging
    if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        'Notification' in window
    ) {
        try {
            const { registerWebPush } = await import('../../firebaseWebPush');

            token = await registerWebPush(displaySystemNotification);

            if (token) {
                await sendPushTokenToBackend(token);
                console.log('[Push Web] Token real de Firebase obtenido.');
            }
        } catch (webErr) {
            console.error('[Push Web] Error al registrar Firebase:', webErr);
        }

        return token;
    }

    if (Platform.OS === 'web') {
        return null;
    }

    try {
        const Notifications = require('expo-notifications');
        const Device = require('expo-device');

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'VetExóticos Notificaciones',
                description: 'Alertas de citas, pedidos y consultas de la clínica',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#16a34a',
                sound: 'default',
            });
        }

        if (!Device.isDevice) {
            console.log('[Push] Aviso: No es un dispositivo físico, el registro puede no generar token nativo');
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Push] Permiso para notificaciones push denegado');
            return null;
        }

        try {
            const expoTokenResponse = await Notifications.getExpoPushTokenAsync();
            token = expoTokenResponse.data;
        } catch (e) {
            try {
                const deviceToken = await Notifications.getDevicePushTokenAsync();
                token = deviceToken.data;
            } catch (deviceErr) {
                console.warn('[Push] Error al obtener Device Push Token:', deviceErr.message);
            }
        }

        if (token) {
            console.log('[Push] Push token obtenido con éxito:', token);
            await sendPushTokenToBackend(token);
        }
    } catch (error) {
        console.error('[Push] Error registrando notificaciones push:', error);
    }

    return token;
}

/**
 * Envía el push token del usuario autenticado al backend
 */
export async function sendPushTokenToBackend(pushToken) {
    if (!pushToken) return;
    try {
        const response = await api.post('/auth/push-token', { pushToken });
        console.log('[Push] Push token registrado en el servidor:', response.data?.message || 'OK');
        return response.data;
    } catch (error) {
        if (error.response?.status !== 401) {
            console.warn('[Push] Advertencia al registrar push token en backend:', error.response?.data?.message || error.message);
        }
    }
}

/**
 * Escucha interacciones con las notificaciones recibidas
 */
export function setupNotificationListeners(navigationRef) {
    if (typeof window !== 'undefined') {
        window.__appNavigationRef = navigationRef;
    }

    if (Platform.OS === 'web') return () => { };

    try {
        const Notifications = require('expo-notifications');

        const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
            console.log('[Push] Notificación recibida:', notification.request.content.title);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            try {
                const data = response.notification.request.content.data;
                if (data && data.screen && navigationRef && navigationRef.isReady()) {
                    navigationRef.navigate(data.screen, data.params || {});
                }
            } catch (err) {
                console.warn('[Push] Error al manejar clic en notificación:', err);
            }
        });

        return () => {
            foregroundSubscription.remove();
            responseSubscription.remove();
        };
    } catch (err) {
        console.warn('[Push] Error al configurar listeners de notificaciones:', err);
        return () => { };
    }
}

/**
 * Consulta la lista de notificaciones del usuario en el servidor
 */
export async function getNotificaciones() {
    try {
        const response = await api.get('/notificaciones');
        return response.data?.data || { notificaciones: [], unreadCount: 0 };
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        return { notificaciones: [], unreadCount: 0 };
    }
}

/**
 * Marca una notificación específica como leída
 */
export async function markNotificacionAsRead(id) {
    try {
        const response = await api.put(`/notificaciones/${id}/leida`);
        return response.data;
    } catch (error) {
        console.error('Error al marcar leída:', error);
    }
}

/**
 * Marca todas las notificaciones del usuario como leídas
 */
export async function markAllNotificacionesAsRead() {
    try {
        const response = await api.put('/notificaciones/marcar-todas');
        return response.data;
    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
    }
}

/**
 * Dispara una prueba de notificación desde el backend (cita, pedido, consulta o todas)
 */
export async function triggerPushNotificationTest(tipo = 'todas') {
    try {
        const response = await api.post(`/notificaciones/test/${tipo}`);
        return response.data;
    } catch (error) {
        console.error('Error al disparar prueba de push:', error);
        throw error;
    }
}
