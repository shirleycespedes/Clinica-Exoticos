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

export default function NotificationBanner({ navigationRef }) {
    const [banner, setBanner] = useState(null);
    const slideAnim = useRef(new Animated.Value(-120)).current;
    const seenIdsRef = useRef(new Set());
    const isFirstRunRef = useRef(true);
    const dismissTimerRef = useRef(null);

    const showBanner = (notif) => {
        setBanner(notif);

        // Feedback de vibración en dispositivos móviles
        if (Platform.OS !== 'web') {
            try {
                Vibration.vibrate([0, 100, 80, 100]);
            } catch (e) {}
        } else if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
            try {
                navigator.vibrate([100, 60, 100]);
            } catch (e) {}
        }

        // Animar entrada desde arriba
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start();

        // Limpiar temporizador previo si existe
        if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
        }

        // Auto-ocultar después de 6.5 segundos
        dismissTimerRef.current = setTimeout(() => {
            hideBanner();
        }, 6500);
    };

    const hideBanner = () => {
        Animated.timing(slideAnim, {
            toValue: -150,
            duration: 250,
            useNativeDriver: true,
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

                    // 1. Notificación en el sistema operativo / navegador (Push visual nativa)
                    displaySystemNotification(latest.titulo, latest.mensaje, latest.data);

                    // 2. Banner flotante interactivo en pantalla en tiempo real
                    showBanner(latest);
                }
            } catch (err) {
                // Silenciar errores de conexión temporal
            }
        };

        // Verificación inicial
        checkNewNotifications();

        // Sondeo rápido en tiempo real cada 3.5 segundos
        const interval = setInterval(checkNewNotifications, 3500);

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
                activeOpacity={0.9}
                onPress={handleBannerPress}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.iconEmoji}>🔔</Text>
                </View>

                <View style={styles.textContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.badgeText}>¡NUEVA NOTIFICACIÓN!</Text>
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
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 16 : 48,
        left: 12,
        right: 12,
        zIndex: 999999,
        elevation: 10,
        alignItems: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a', // Azul pizarra oscuro moderno
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        maxWidth: 550,
        width: '100%',
        borderWidth: 1.5,
        borderColor: '#10b981', // Verde esmeralda brillante
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#064e3b',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#10b981',
    },
    iconEmoji: {
        fontSize: 22,
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
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 2,
    },
    message: {
        fontSize: 12,
        color: '#cbd5e1',
        lineHeight: 16,
    },
    tapToOpen: {
        fontSize: 11,
        color: '#34d399',
        fontWeight: '600',
        marginTop: 3,
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    closeBtnText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: 'bold',
    },
});
