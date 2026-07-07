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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from './authService';

const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
        alert(message ? `${title}\n\n${message}` : title);
    } else {
        Alert.alert(title, message);
    }
};

export default function DashboardScreen({ navigation }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    setUser(JSON.parse(userData));
                }
            } catch (error) {
                console.error('Error al cargar datos de usuario:', error);
            }
        };
        loadUser();
    }, []);

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
                    <TouchableOpacity 
                        style={styles.profileHeaderBtn} 
                        onPress={() => navigation.replace('Perfil')}
                    >
                        <Text style={styles.profileHeaderEmoji}>👤</Text>
                        <Text style={styles.profileHeaderLabel}>Mi Perfil</Text>
                    </TouchableOpacity>
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
});
