import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    Platform,
    Modal,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from './authService';
import { 
    registerForPushNotificationsAsync,
    getNotificaciones,
    markNotificacionAsRead,
    markAllNotificacionesAsRead,
    displaySystemNotification,
} from './notificationService';

const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
        alert(message ? `${title}\n\n${message}` : title);
    } else {
        Alert.alert(title, message);
    }
};

export default function DashboardScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [notifModalVisible, setNotifModalVisible] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotificaciones = async () => {
        try {
            const data = await getNotificaciones();
            setNotificaciones(data.notificaciones || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            console.warn('Error cargando notificaciones:', err);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const loadUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData && isMounted) {
                    setUser(JSON.parse(userData));
                    // Registrar el push token del dispositivo para este usuario
                    registerForPushNotificationsAsync().catch((err) => {
                        console.warn('Error registrando push token en dashboard:', err);
                    });
                    loadNotificaciones();
                }
            } catch (error) {
                console.error('Error al cargar datos de usuario:', error);
            }
        };
        loadUser();

        const interval = setInterval(() => {
            if (isMounted) loadNotificaciones();
        }, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleMarkAllRead = async () => {
        await markAllNotificacionesAsRead();
        await loadNotificaciones();
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigation.replace('Login');
        } catch (error) {
            showAlert('Error', 'No se pudo cerrar la sesión');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerEmoji}>🦎</Text>
                        <View>
                            <Text style={styles.welcomeText}>Bienvenido,</Text>
                            <Text style={styles.userName}>{user ? user.nombre : 'Cargando...'}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity 
                            style={styles.notifHeaderBtn} 
                            onPress={() => setNotifModalVisible(true)}
                        >
                            <Text style={styles.notifHeaderEmoji}>🔔</Text>
                            {unreadCount > 0 && (
                                <View style={styles.notifBadge}>
                                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.profileHeaderBtn} 
                            onPress={() => navigation.replace('Perfil')}
                        >
                            <Text style={styles.profileHeaderEmoji}>👤</Text>
                            <Text style={styles.profileHeaderLabel}>Mi Perfil</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dashboard Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Clínica VetExóticos 🐾</Text>
                    <Text style={styles.cardSubtitle}>
                        Panel de Administración y Control
                    </Text>
                    <Text style={styles.cardInfo}>
                        Rol de usuario: <Text style={styles.boldText}>{user ? user.rol?.toUpperCase() : '...'}</Text>
                    </Text>
                </View>

                {/* Actions Grid */}
                <Text style={styles.sectionTitle}>
                    {user && user.rol === 'admin' ? 'Administración' : 'Mis Servicios'}
                </Text>
                
                {user && user.rol === 'admin' ? (
                    <View style={styles.grid}>
                        <TouchableOpacity 
                            style={styles.gridItem} 
                            onPress={() => navigation.replace('Citas')}
                        >
                            <Text style={styles.gridEmoji}>📅</Text>
                            <Text style={styles.gridLabel}>Ver Citas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.gridItem}
                            onPress={() => navigation.replace('Mascotas')}
                        >
                            <Text style={styles.gridEmoji}>🐱</Text>
                            <Text style={styles.gridLabel}>Pacientes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.gridItem}
                            onPress={() => navigation.replace('Expedientes')}
                        >
                            <Text style={styles.gridEmoji}>📂</Text>
                            <Text style={styles.gridLabel}>Expedientes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.gridItem}
                            onPress={() => navigation.replace('Consultas')}
                        >
                            <Text style={styles.gridEmoji}>💼</Text>
                            <Text style={styles.gridLabel}>Consultas</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        <TouchableOpacity 
                            style={styles.gridItem}
                            onPress={() => navigation.replace('AgendarCita')}
                        >
                            <Text style={styles.gridEmoji}>➕📅</Text>
                            <Text style={styles.gridLabel}>Agendar Cita</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.gridItem}
                            onPress={() => navigation.replace('Citas')}
                        >
                            <Text style={styles.gridEmoji}>📅</Text>
                            <Text style={styles.gridLabel}>Mis Citas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.gridItem}
                            onPress={() => navigation.replace('Mascotas')}
                        >
                            <Text style={styles.gridEmoji}>🐱</Text>
                            <Text style={styles.gridLabel}>Mis Mascotas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.gridItem}
                            onPress={() => navigation.replace('Expedientes')}
                        >
                            <Text style={styles.gridEmoji}>📂</Text>
                            <Text style={styles.gridLabel}>Mis Expedientes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.gridItem}
                            onPress={() => navigation.replace('Tienda')}
                        >
                            <Text style={styles.gridEmoji}>🛍️</Text>
                            <Text style={styles.gridLabel}>Tienda y Pedidos</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Admin Actions */}
                {user && user.rol === 'admin' && (
                    <View style={{ marginBottom: 15 }}>
                        <Text style={styles.sectionTitle}>Acciones de Administrador</Text>
                        <TouchableOpacity 
                            style={styles.adminActionCard} 
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.adminActionEmoji}>👤➕</Text>
                            <View style={styles.adminActionTexts}>
                                <Text style={styles.adminActionTitle}>Registrar Nuevo Usuario</Text>
                                <Text style={styles.adminActionSubtitle}>
                                    Agrega clientes o nuevos administradores.
                                </Text>
                            </View>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.adminActionCard} 
                            onPress={() => navigation.replace('Usuarios')}
                        >
                            <Text style={styles.adminActionEmoji}>👥</Text>
                            <View style={styles.adminActionTexts}>
                                <Text style={styles.adminActionTitle}>Gestión de Usuarios y Personal</Text>
                                <Text style={styles.adminActionSubtitle}>
                                    Ver y buscar personal veterinario y clientes registrados.
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.adminActionCard} 
                            onPress={() => navigation.replace('Inventario')}
                        >
                            <Text style={styles.adminActionEmoji}>📦</Text>
                            <View style={styles.adminActionTexts}>
                                <Text style={styles.adminActionTitle}>Inventario y Pedidos</Text>
                                <Text style={styles.adminActionSubtitle}>
                                    Gestiona el stock de productos exóticos y los pedidos de clientes.
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Modal de Notificaciones Push */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={notifModalVisible}
                onRequestClose={() => setNotifModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>🔔 Notificaciones</Text>
                                <Text style={styles.modalSubtitle}>Historial de alertas y avisos del sistema</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setNotifModalVisible(false)} 
                                style={styles.modalCloseBtn}
                            >
                                <Text style={styles.modalCloseBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.notifListHeader}>
                            <Text style={styles.notifListTitle}>Bandeja de Entrada</Text>
                            {unreadCount > 0 && (
                                <TouchableOpacity onPress={handleMarkAllRead}>
                                    <Text style={styles.markAllReadText}>Marcar todas como leídas</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView style={styles.notifScroll} showsVerticalScrollIndicator={true}>
                            {notificaciones.length === 0 ? (
                                <View style={styles.emptyNotifs}>
                                    <Text style={styles.emptyNotifsEmoji}>📭</Text>
                                    <Text style={styles.emptyNotifsText}>No hay notificaciones aún.</Text>
                                    <Text style={styles.emptyNotifsSub}>Las notificaciones automáticas de citas, pedidos, pacientes y expedientes aparecerán aquí.</Text>
                                </View>
                            ) : (
                                notificaciones.map((n) => (
                                    <TouchableOpacity 
                                        key={n.id} 
                                        style={[styles.notifItem, n.leida === 0 && styles.notifItemUnread]}
                                        onPress={async () => {
                                            if (n.leida === 0) {
                                                await markNotificacionAsRead(n.id);
                                                await loadNotificaciones();
                                            }
                                            if (n.data?.screen) {
                                                setNotifModalVisible(false);
                                                navigation.navigate(n.data.screen, n.data.params || {});
                                            }
                                        }}
                                    >
                                        <View style={styles.notifItemTop}>
                                            <Text style={styles.notifItemTitle}>{n.titulo}</Text>
                                            {n.leida === 0 && <View style={styles.unreadDot} />}
                                        </View>
                                        <Text style={styles.notifItemBody}>{n.mensaje}</Text>
                                        <Text style={styles.notifItemDate}>
                                            {new Date(n.created_at).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })} - {new Date(n.created_at).toLocaleDateString('es-CR')}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
        marginTop: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileHeaderBtn: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    profileHeaderEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    profileHeaderLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    headerEmoji: {
        fontSize: 40,
        marginRight: 15,
    },
    welcomeText: {
        fontSize: 14,
        color: '#64748b',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    card: {
        backgroundColor: '#2563eb',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 30,
    },
    cardTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardSubtitle: {
        color: '#93c5fd',
        fontSize: 14,
        marginBottom: 15,
    },
    cardInfo: {
        color: '#ffffff',
        fontSize: 14,
    },
    boldText: {
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 15,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    gridItem: {
        backgroundColor: '#ffffff',
        width: '47%',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    gridEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    gridLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    logoutButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    adminActionCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    adminActionEmoji: {
        fontSize: 28,
        marginRight: 15,
    },
    adminActionTexts: {
        flex: 1,
    },
    adminActionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    adminActionSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    notifHeaderBtn: {
        position: 'relative',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 20,
        width: 38,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    notifHeaderEmoji: {
        fontSize: 18,
    },
    notifBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    notifBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        maxHeight: '85%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 12,
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    modalCloseBtn: {
        padding: 4,
        marginLeft: 10,
    },
    modalCloseBtnText: {
        fontSize: 18,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    notifListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    notifListTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    markAllReadText: {
        fontSize: 12,
        color: '#2563eb',
        fontWeight: '600',
    },
    notifScroll: {
        maxHeight: 450,
    },
    emptyNotifs: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyNotifsEmoji: {
        fontSize: 36,
        marginBottom: 6,
    },
    emptyNotifsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    emptyNotifsSub: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 20,
    },
    notifItem: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    notifItemUnread: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },
    notifItemTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifItemTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563eb',
        marginLeft: 6,
    },
    notifItemBody: {
        fontSize: 12,
        color: '#475569',
        lineHeight: 17,
        marginBottom: 6,
    },
    notifItemDate: {
        fontSize: 10,
        color: '#94a3b8',
    },
});
