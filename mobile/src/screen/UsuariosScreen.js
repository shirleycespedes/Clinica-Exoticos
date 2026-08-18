import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    TextInput,
    Alert,
    Platform,
    ScrollView,
} from 'react-native';
import api from './api';

const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
        alert(message ? `${title}\n\n${message}` : title);
    } else {
        Alert.alert(title, message);
    }
};

export default function UsuariosScreen({ navigation }) {
    const [usuarios, setUsuarios] = useState([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('personal'); // 'personal' (admin) | 'clientes' (cliente)
    const [searchQuery, setSearchQuery] = useState('');

    const loadUsuarios = async () => {
        try {
            const response = await api.get('/auth/users');
            if (response.data.success) {
                setUsuarios(response.data.data);
            }
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
            setError('No se pudieron obtener los usuarios del sistema.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (formato, modulo, pacienteId = null) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const baseUrl = api.defaults.baseURL;
            let url = `${baseUrl}/reportes/exportar/${formato}/${modulo}?token=${token}`;
            if (pacienteId) {
                url += `&pacienteId=${pacienteId}`;
            }
            if (Platform.OS === 'web') {
                window.open(url, '_blank');
            } else {
                const { Linking } = require('react-native');
                Linking.openURL(url);
            }
        } catch (err) {
            console.error(err);
            showAlert('Error', 'No se pudo descargar el reporte.');
        }
    };

    const handleDeleteUser = (item) => {
        const confirmDelete = () => {
            setLoading(true);
            api.delete(`/auth/users/${item.id}`)
                .then(res => {
                    if (res.data.success) {
                        showAlert('Éxito', 'El usuario ha sido eliminado correctamente.');
                        loadUsuarios();
                    }
                })
                .catch(err => {
                    setLoading(false);
                    showAlert('Error', err.response?.data?.message || 'No se pudo eliminar el usuario.');
                });
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${item.nombre}"?`)) {
                confirmDelete();
            }
        } else {
            Alert.alert(
                'Confirmación',
                `¿Estás seguro de que deseas eliminar permanentemente al usuario "${item.nombre}"?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: confirmDelete }
                ]
            );
        }
    };

    useEffect(() => {
        loadUsuarios();
    }, []);

    // Filtrar y separar usuarios según la pestaña activa y la búsqueda
    useEffect(() => {
        const roleFilter = activeTab === 'personal' ? 'admin' : 'cliente';
        
        let filtered = usuarios.filter(u => u.rol === roleFilter);

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                u => 
                    u.nombre.toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query) ||
                    (u.telefono && u.telefono.includes(query))
            );
        }

        setFilteredUsuarios(filtered);
    }, [activeTab, usuarios, searchQuery]);

    const renderUserItem = ({ item }) => {
        return (
            <View style={styles.userCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {item.rol === 'admin' ? '👨‍⚕️' : '👤'}
                        </Text>
                    </View>
                    <View style={styles.headerTexts}>
                        <Text style={styles.userName}>
                            {item.nombre} {item.rol === 'cliente' && item.apellido ? item.apellido : ''}
                        </Text>
                        <Text style={styles.userRole}>
                            {item.rol === 'admin' ? 'PERSONAL VETERINARIO' : 'CLIENTE'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {item.rol === 'cliente' && (
                        <>
                            <Text style={styles.label}>Cédula:</Text>
                            <Text style={styles.valueText}>{item.cedula || 'No registrada'}</Text>
                        </>
                    )}

                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.valueText}>{item.email}</Text>

                    <Text style={styles.label}>Teléfono:</Text>
                    <Text style={styles.valueText}>{item.telefono || 'No registrado'}</Text>

                    {item.rol === 'cliente' && (
                        <>
                            <Text style={styles.label}>Mascotas Registradas ({item.mascotas_count}):</Text>
                            {item.mascotas && item.mascotas.length > 0 ? (
                                <View style={styles.petsBadgeContainer}>
                                    {item.mascotas.map((pet, idx) => (
                                        <View key={pet.id || idx} style={[styles.petBadge, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 6 }]}>
                                            <Text style={styles.petBadgeText}>
                                                🐾 {pet.nombre} ({pet.especie})
                                            </Text>
                                            <View style={{ flexDirection: 'row', gap: 4, marginLeft: 8 }}>
                                                <TouchableOpacity 
                                                    style={[styles.exportMiniBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]} 
                                                    onPress={() => handleExport('excel', 'pacientes', pet.id)}
                                                >
                                                    <Text style={{ color: '#16a34a', fontSize: 9, fontWeight: 'bold' }}>📊 Excel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    style={[styles.exportMiniBtn, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]} 
                                                    onPress={() => handleExport('pdf', 'pacientes', pet.id)}
                                                >
                                                    <Text style={{ color: '#ef4444', fontSize: 9, fontWeight: 'bold' }}>📄 PDF</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.noPetsText}>Sin mascotas asociadas todavía.</Text>
                            )}
                        </>
                    )}

                    <Text style={styles.label}>Fecha de Registro:</Text>
                    <Text style={styles.valueText}>
                        {new Date(item.fecha_creacion).toLocaleDateString()}
                    </Text>

                    <TouchableOpacity 
                        style={styles.deleteUserBtn} 
                        onPress={() => handleDeleteUser(item)}
                    >
                        <Text style={styles.deleteUserBtnText}>🗑️ Eliminar Usuario</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹ Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
                </View>

                {/* Barra de Búsqueda */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94a3b8"
                    />
                    {/* Export Buttons */}
                    <View style={styles.exportButtonsContainer}>
                        <TouchableOpacity 
                            style={[styles.exportBtn, styles.exportExcelBtn]} 
                            onPress={() => handleExport('excel', 'clientes')}
                        >
                            <Text style={styles.exportExcelBtnText}>📊 Exportar Excel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.exportBtn, styles.exportPdfBtn]} 
                            onPress={() => handleExport('pdf', 'clientes')}
                        >
                            <Text style={styles.exportPdfBtnText}>📄 Exportar PDF</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Selector de Pestañas (Tabs) */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'personal' && styles.tabButtonActive]}
                        onPress={() => { setActiveTab('personal'); setSearchQuery(''); }}
                    >
                        <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>
                            👨‍⚕️ Personal ({usuarios.filter(u => u.rol === 'admin').length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'clientes' && styles.tabButtonActive]}
                        onPress={() => { setActiveTab('clientes'); setSearchQuery(''); }}
                    >
                        <Text style={[styles.tabText, activeTab === 'clientes' && styles.tabTextActive]}>
                            👥 Clientes ({usuarios.filter(u => u.rol === 'cliente').length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>Cargando usuarios...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : filteredUsuarios.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            🔍 No se encontraron usuarios en esta categoría.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.listContent}>
                        {filteredUsuarios.map((item) => (
                            <React.Fragment key={item.id}>
                                {renderUserItem({ item })}
                            </React.Fragment>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    backButtonText: {
        color: '#2563eb',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    searchInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#64748b',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 15,
    },
    listContent: {
        padding: 16,
        paddingBottom: 60,
    },
    userCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
        marginBottom: 12,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
    },
    headerTexts: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    userRole: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2563eb',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    cardBody: {
        paddingLeft: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94a3b8',
        marginTop: 8,
    },
    valueText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
        marginTop: 1,
    },
    petsBadgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
        marginBottom: 4,
    },
    petBadge: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        margin: 2,
    },
    petBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e40af',
    },
    noPetsText: {
        fontSize: 13,
        fontStyle: 'italic',
        color: '#94a3b8',
        marginTop: 2,
    },
    deleteUserBtn: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    deleteUserBtnText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: 'bold',
    },
    exportButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingTop: 10,
        backgroundColor: '#f8fafc',
        gap: 8,
    },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
    },
    exportExcelBtn: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
    },
    exportPdfBtn: {
        backgroundColor: '#fef2f2',
        borderColor: '#fca5a5',
    },
    exportExcelBtnText: {
        color: '#16a34a',
        fontSize: 12,
        fontWeight: '600',
    },
    exportPdfBtnText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '600',
    },
    exportMiniBtn: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
