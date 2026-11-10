import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
    Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getNotificaciones,
    markNotificacionAsRead,
    displaySystemNotification,
} from './notificationService';

/**
 * Genera un sonido de campana sutil utilizando la API Web Audio nativa
 * (No requiere descargar archivos MP3 y funciona en Chrome, Edge, Firefox, Safari)
 */
function playWebNotificationSound() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Nota 1 (659 Hz - E5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain1.gain.setValueAtTime(0.18, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.28);

        // Nota 2 (830 Hz - G#5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(830.61, ctx.currentTime + 0.14);
        gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.14);
        osc2.stop(ctx.currentTime + 0.55);
    } catch (e) {
        // Ignorar si el navegador requiere interacción previa
    }
}

export default function NotificationBanner({ navigationRef }) {
    const [banner, setBanner] = useState(null);
    const slideAnim = useRef(new Animated.Value(-150)).current;
    const seenIdsRef = useRef(new Set());
    const isFirstRunRef = useRef(true);
    const dismissTimerRef = useRef(null);

    const showBanner = (notif) => {
        setBanner(notif);

        // 1. Sonido y vibración
        if (Platform.OS === 'web') {
            playWebNotificationSound();
            if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
                try { navigator.vibrate([100, 60, 100]); } catch (e) {}
            }
        } else {
            try { Vibration.vibrate([0, 100, 80, 100]); } catch (e) {}
        }

        // 2. Animar entrada (useNativeDriver: false en Web para máxima compatibilidad)
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: Platform.OS !== 'web',
            tension: 50,
            friction: 7,
        }).start();

        // 3. Temporizador de auto-cierre a los 7 segundos
        if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
        }

        dismissTimerRef.current = setTimeout(() => {
            hideBanner();
        }, 7000);
    };

    const hideBanner = () => {
        Animated.timing(slideAnim, {
            toValue: -160,
            duration: 250,
            useNativeDriver: Platform.OS !== 'web',
        }).start(() => {
            setBanner(null);
        });
    };

    const handleBannerPress = async () => {
        if (!banner) return;
        const currentNotif = banner;
        hideBanner();

        try {
            await markNotificacionAsRead(currentNotif.id);
        } catch (e) {}

        // Redirigir a la pantalla correspondiente
        if (currentNotif.data?.screen && navigationRef && navigationRef.isReady()) {
            navigationRef.navigate(
                currentNotif.data.screen,
                currentNotif.data.params || {}
            );
        }
    };

    useEffect(() => {
        let isMounted = true;

        // En Web: solicitar permiso de notificaciones del sistema si está pendiente
        if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
            if (window.Notification.permission === 'default') {
                try {
                    window.Notification.requestPermission().catch(() => {});
                } catch (e) {}
            }
        }

        const checkNewNotifications = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token || !isMounted) return;

                const data = await getNotificaciones();
                const list = data?.notificaciones || [];

                if (isFirstRunRef.current) {
                    // Inicializar los IDs ya existentes para no disparar alertas antiguas
                    list.forEach((n) => seenIdsRef.current.add(n.id));
                    isFirstRunRef.current = false;
                    return;
                }

                // Buscar notificaciones nuevas no leídas que acaban de llegar
                const newItems = list.filter(
                    (n) => !seenIdsRef.current.has(n.id) && n.leida === 0
                );

                if (newItems.length > 0 && isMounted) {
                    const latest = newItems[0];
                    // Marcar en vistos para no repetir
                    newItems.forEach((n) => seenIdsRef.current.add(n.id));

                    // 1. Notificación en el sistema operativo / navegador (Push nativa en Windows/Android)
                    displaySystemNotification(latest.titulo, latest.mensaje, latest.data);

                    // 2. Banner flotante interactivo en pantalla en tiempo real
                    showBanner(latest);
                }
            } catch (err) {
                // Silenciar errores temporales de conexión
            }
        };

        // Verificación inicial
        checkNewNotifications();

        // Sondeo rápido en tiempo real cada 3 segundos
        const interval = setInterval(checkNewNotifications, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
            if (dismissTimerRef.current) {
                clearTimeout(dismissTimerRef.current);
            }
        };
    }, []);

    if (!banner) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.92}
                onPress={handleBannerPress}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.iconEmoji}>🔔</Text>
                </View>

                <View style={styles.textContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.badgeText}>¡NUEVA NOTIFICACIÓN EN VIVO!</Text>
                    </View>
                    <Text style={styles.title} numberOfLines={1}>
                        {banner.titulo}
                    </Text>
                    <Text style={styles.message} numberOfLines={2}>
                        {banner.mensaje}
                    </Text>
                    <Text style={styles.tapToOpen}>Toca para ver detalles →</Text>
                </View>

                <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={hideBanner}
                    hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                    <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        top: Platform.OS === 'web' ? 20 : 48,
        left: 0,
        right: 0,
        zIndex: 9999999,
        elevation: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        pointerEvents: 'box-none',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a', // Fondo oscuro moderno
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        maxWidth: 580,
        width: '100%',
        borderWidth: 2,
        borderColor: '#10b981', // Verde esmeralda brillante
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 12,
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#064e3b',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1.5,
        borderColor: '#10b981',
    },
    iconEmoji: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10b981',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        color: '#cbd5e1',
        lineHeight: 18,
    },
    tapToOpen: {
        fontSize: 11,
        color: '#34d399',
        fontWeight: '700',
        marginTop: 4,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    closeBtnText: {
        color: '#cbd5e1',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
