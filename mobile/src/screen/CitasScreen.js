import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Modal,
    ScrollView,
    Alert,
    Platform,
    TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
        alert(message ? `${title}\n\n${message}` : title);
    } else {
        Alert.alert(title, message);
    }
};

export default function CitasScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Admin management modal states
    const [manageModalVisible, setManageModalVisible] = useState(false);
    const [selectedCita, setSelectedCita] = useState(null);
    const [statusToUpdate, setStatusToUpdate] = useState('');
    const [vetToUpdate, setVetToUpdate] = useState('');
    const [admins, setAdmins] = useState([]);
    const [activeTab, setActiveTab] = useState('todas');
    const [searchQuery, setSearchQuery] = useState('');

    const getTodayDateString = () => {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const [searchDate, setSearchDate] = useState(getTodayDateString());

    const availableHours = [
        '06:00', '07:00', '08:00', '09:00', '10:00', 
        '11:00', '12:00', '13:00', '14:00', '15:00'
    ];

    const getDisponiblesForDate = (dateStr) => {
        if (!dateStr) return availableHours;
        const dateParts = dateStr.trim().split('-');
        if (dateParts.length === 3) {
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const day = parseInt(dateParts[2]);
            const selectedDate = new Date(year, month, day);
            const dayOfWeek = selectedDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return []; // No hay citas los fines de semana
            }
        }
        const occupied = citas
            .filter(c => {
                const cDate = new Date(c.fecha_cita).toISOString().split('T')[0];
                return cDate === dateStr.trim() && c.estado !== 'cancelada';
            })
            .map(c => c.hora_cita.substring(0, 5));
        return availableHours.filter(h => !occupied.includes(h));
    };

    const loadUserAndCitas = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                
                const endpoint = parsedUser.rol === 'admin' ? '/citas' : '/citas/mis-citas';
                const response = await api.get(endpoint);
                
                if (response.data.success) {
                    setCitas(response.data.data);
                }

                // Si es admin, cargar la lista de administradores elegibles para veterinario
                if (parsedUser.rol === 'admin') {
                    const adminsRes = await api.get('/auth/admins');
                    if (adminsRes.data.success) {
                        setAdmins(adminsRes.data.data);
                    }
                }
            }
        } catch (err) {
            console.error('Error al cargar citas:', err);
            setError('No se pudieron cargar las citas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserAndCitas();
    }, []);

    const handleCancelarCita = async (citaId) => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm('¿Estás seguro de que deseas cancelar esta cita?');
            if (confirm) executeCancel(citaId);
        } else {
            Alert.alert(
                'Cancelar Cita',
                '¿Estás seguro de que deseas cancelar esta cita?',
                [
                    { text: 'No', style: 'cancel' },
                    { text: 'Sí, cancelar', style: 'destructive', onPress: () => executeCancel(citaId) }
                ]
            );
        }
    };

    const executeCancel = async (citaId) => {
        setActionLoading(true);
        try {
            const response = await api.put(`/citas/${citaId}/cancelar`);
            if (response.data.success) {
                showAlert('Éxito', 'La cita ha sido cancelada correctamente.');
                loadUserAndCitas();
            }
        } catch (err) {
            console.error('Error al cancelar cita:', err);
            const errMsg = err.response?.data?.message || 'No se pudo cancelar la cita.';
            showAlert('Error', errMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const openManageModal = (cita) => {
        setSelectedCita(cita);
        setStatusToUpdate(cita.estado);
        setVetToUpdate(cita.veterinario_asignado || (admins.length > 0 ? admins[0].nombre : 'Por definir'));
        setManageModalVisible(true);
    };

    const handleSaveManagement = async () => {
        if (!selectedCita) return;

        setActionLoading(true);
        try {
            // Asegurar formato AAAA-MM-DD
            const rawDate = new Date(selectedCita.fecha_cita);
            const yyyy = rawDate.getFullYear();
            const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
            const dd = String(rawDate.getDate()).padStart(2, '0');
            const formattedDate = `${yyyy}-${mm}-${dd}`;

            const body = {
                paciente_id: selectedCita.paciente_id,
                propietario_id: selectedCita.propietario_id,
                fecha_cita: formattedDate,
                hora_cita: selectedCita.hora_cita.substring(0, 5),
                motivo: selectedCita.motivo || 'Revisión general',
                estado: statusToUpdate,
                veterinario_asignado: vetToUpdate
            };

            const response = await api.put(`/citas/${selectedCita.id}`, body);
            if (response.data.success) {
                showAlert('Éxito', 'La cita se actualizó correctamente.');
                setManageModalVisible(false);
                loadUserAndCitas();
            }
        } catch (err) {
            console.error('Error al gestionar cita por admin:', err);
            const errMsg = err.response?.data?.message || 'No se pudo guardar la gestión de la cita.';
            showAlert('Error', errMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pendiente':
                return { bg: '#fef3c7', text: '#d97706' };
            case 'confirmada':
                return { bg: '#eff6ff', text: '#2563eb' };
            case 'completada':
                return { bg: '#f0fdf4', text: '#16a34a' };
            case 'cancelada':
                return { bg: '#fef2f2', text: '#ef4444' };
            default:
                return { bg: '#f1f5f9', text: '#64748b' };
        }
    };

    const renderCitaItem = ({ item }) => {
        const statusColors = getStatusStyle(item.estado);
        const formatTime = item.hora_cita.substring(0, 5);

        return (
            <View style={styles.citaCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.petName}>🐱 Mascota: {item.paciente_nombre || 'Paciente'}</Text>
                        {user && user.rol === 'admin' && (
                            <Text style={styles.ownerName}>
                                Propietario: {item.propietario_nombre} {item.propietario_apellido}
                            </Text>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {item.estado.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.dateTimeRow}>
                        <Text style={styles.infoText}>📅 {new Date(item.fecha_cita).toLocaleDateString()}</Text>
                        <Text style={styles.infoText}>⏰ {formatTime}</Text>
                    </View>

                    <Text style={styles.label}>Motivo:</Text>
                    <Text style={styles.motivoText}>{item.motivo || 'Revisión general'}</Text>

                    <Text style={styles.label}>Doctor / Veterinario:</Text>
                    <Text style={styles.vetText}>{item.veterinario_asignado || 'Por definir'}</Text>
                </View>

                {/* Acciones de Cliente */}
                {user && user.rol === 'cliente' && item.estado === 'pendiente' && (
                    <TouchableOpacity 
                        style={styles.cancelButton} 
                        onPress={() => handleCancelarCita(item.id)}
                        disabled={actionLoading}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar Cita</Text>
                    </TouchableOpacity>
                )}

                {/* Acciones de Administrador */}
                {user && user.rol === 'admin' && (
                    <TouchableOpacity 
                        style={styles.manageButton} 
                        onPress={() => openManageModal(item)}
                    >
                        <Text style={styles.manageButtonText}>⚙️ Gestionar Cita</Text>
                    </TouchableOpacity>
                )}
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
                    <Text style={styles.headerTitle}>
                        {user && user.rol === 'admin' ? 'Control de Citas (Admin)' : 'Mis Citas Agendadas'}
                    </Text>
                </View>

                {/* Selector de Pestañas (Tabs) de Estado de Citas */}
                {!loading && !error && (
                    <View style={styles.tabContainer}>
                        <ScrollView 
                            horizontal={true} 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tabScrollContent}
                        >
                            {[
                                { id: 'todas', label: '📅 Todas', count: citas.length },
                                { id: 'pendiente', label: '⏳ Pendientes', count: citas.filter(c => c.estado === 'pendiente').length },
                                { id: 'confirmada', label: '✅ Confirmadas', count: citas.filter(c => c.estado === 'confirmada').length },
                                { id: 'completada', label: '💚 Completadas', count: citas.filter(c => c.estado === 'completada').length },
                                { id: 'cancelada', label: '❌ Canceladas', count: citas.filter(c => c.estado === 'cancelada').length },
                                ...(user?.rol === 'admin' ? [{ id: 'disponibles', label: '🔍 Disponibles', count: getDisponiblesForDate(searchDate).length }] : [])
                            ].map((tab) => (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[
                                        styles.tabButton, 
                                        activeTab === tab.id && styles.tabButtonActive
                                    ]}
                                    onPress={() => setActiveTab(tab.id)}
                                >
                                    <Text style={[
                                        styles.tabText, 
                                        activeTab === tab.id && styles.tabTextActive
                                    ]}>
                                        {tab.label} ({tab.count})
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Buscador de Citas */}
                {!loading && !error && activeTab !== 'disponibles' && (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="🔍 Buscar cita por paciente, dueño, motivo..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>Cargando citas...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : activeTab === 'disponibles' ? (
                    <View style={styles.listContent}>
                        {(() => {
                            const freeHours = getDisponiblesForDate(searchDate);
                            return (
                                <View style={styles.disponiblesContainer}>
                                    <Text style={styles.dateLabel}>Consultar Fecha (AAAA-MM-DD):</Text>
                                    <TextInput
                                        style={styles.dateInput}
                                        value={searchDate}
                                        onChangeText={setSearchDate}
                                        placeholder="AAAA-MM-DD"
                                    />
                                    <Text style={styles.disponiblesSubTitle}>Horas Disponibles para {searchDate}:</Text>
                                    {freeHours.length === 0 ? (
                                        <Text style={styles.noHoursText}>
                                            {(() => {
                                                const dateParts = searchDate.trim().split('-');
                                                if (dateParts.length === 3) {
                                                    const year = parseInt(dateParts[0]);
                                                    const month = parseInt(dateParts[1]) - 1;
                                                    const day = parseInt(dateParts[2]);
                                                    const selectedDate = new Date(year, month, day);
                                                    const dayOfWeek = selectedDate.getDay();
                                                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                                                        return '📅 Las citas de la clínica veterinaria solo se atienden de Lunes a Viernes de 06:00 a 15:00.';
                                                    }
                                                }
                                                return '📅 No hay horarios disponibles para esta fecha.';
                                            })()}
                                        </Text>
                                    ) : (
                                        <View style={styles.hoursGrid}>
                                            {freeHours.map((h) => (
                                                <View key={h} style={styles.hourCard}>
                                                    <Text style={styles.hourText}>🕒 {h}</Text>
                                                    <TouchableOpacity
                                                        style={styles.bookBtn}
                                                        onPress={() => navigation.navigate('AgendarCita', { fecha: searchDate, hora: h })}
                                                    >
                                                        <Text style={styles.bookBtnText}>➕ Agendar</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })()}
                    </View>
                ) : citas.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>📅 No hay citas en el sistema.</Text>
                    </View>
                ) : (
                    <View style={styles.listContent}>
                        {(() => {
                            const filteredCitas = citas.filter(c => {
                                // 1. Filtrar por pestaña
                                if (activeTab !== 'todas' && c.estado !== activeTab) return false;
                                
                                // 2. Filtrar por buscador
                                const q = searchQuery.toLowerCase().trim();
                                if (!q) return true;

                                const paciente = (c.paciente_nombre || '').toLowerCase();
                                const propNombre = (c.propietario_nombre || '').toLowerCase();
                                const propApellido = (c.propietario_apellido || '').toLowerCase();
                                const motivo = (c.motivo || '').toLowerCase();
                                const veterinario = (c.veterinario_asignado || '').toLowerCase();

                                return paciente.includes(q) || 
                                       propNombre.includes(q) || 
                                       propApellido.includes(q) || 
                                       motivo.includes(q) ||
                                       veterinario.includes(q);
                            });

                            if (filteredCitas.length === 0) {
                                return (
                                    <View style={styles.emptyTabContainer}>
                                        <Text style={styles.emptyText}>📅 No hay citas con este estado o búsqueda.</Text>
                                    </View>
                                );
                            }
                            return filteredCitas.map((item) => (
                                <React.Fragment key={item.id}>
                                    {renderCitaItem({ item })}
                                </React.Fragment>
                            ));
                        })()}
                    </View>
                )}
            </ScrollView>

            {/* Modal para que el Admin gestione estado y asigne veterinario (rol admin) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={manageModalVisible}
                onRequestClose={() => setManageModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>⚙️ Gestionar Cita</Text>
                        <ScrollView contentContainerStyle={styles.modalScroll} persistentScrollbar={true}>
                            {selectedCita && (
                                <>
                                    <Text style={styles.infoSubtitle}>
                                        Mascota: {selectedCita.paciente_nombre}
                                    </Text>
                                    <Text style={styles.infoSubtitle}>
                                        Dueño: {selectedCita.propietario_nombre} {selectedCita.propietario_apellido}
                                    </Text>

                                    {/* Estado */}
                                    <Text style={styles.label}>Estado de la Cita *</Text>
                                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                        {['pendiente', 'confirmada', 'completada', 'cancelada'].map((status) => (
                                            <TouchableOpacity
                                                key={status}
                                                style={[
                                                    styles.selectorOption,
                                                    statusToUpdate === status && {
                                                        borderColor: getStatusStyle(status).text,
                                                        backgroundColor: getStatusStyle(status).bg
                                                    }
                                                ]}
                                                onPress={() => setStatusToUpdate(status)}
                                            >
                                                <Text style={[
                                                    styles.selectorOptionText,
                                                    statusToUpdate === status && {
                                                        color: getStatusStyle(status).text,
                                                        fontWeight: 'bold'
                                                    }
                                                ]}>
                                                    {status.toUpperCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    {/* Veterinario */}
                                    <Text style={styles.label}>Asignar Veterinario (Admin Registrado) *</Text>
                                    {admins.length === 0 ? (
                                        <Text style={styles.noVetsText}>No hay veterinarios registrados.</Text>
                                    ) : (
                                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                            {admins.map((admin) => (
                                                <TouchableOpacity
                                                    key={admin.id}
                                                    style={[
                                                        styles.selectorOption,
                                                        vetToUpdate === admin.nombre && styles.selectorOptionActive
                                                    ]}
                                                    onPress={() => setVetToUpdate(admin.nombre)}
                                                >
                                                    <Text style={[
                                                        styles.selectorOptionText,
                                                        vetToUpdate === admin.nombre && styles.selectorOptionTextActive
                                                    ]}>
                                                        👨‍⚕️ {admin.nombre}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelModalBtn]} 
                                onPress={() => setManageModalVisible(false)}
                            >
                                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.saveModalBtn]} 
                                onPress={handleSaveManagement}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveModalBtnText}>Guardar Cambios</Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 60,
    },
    citaCard: {
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
        marginBottom: 10,
    },
    petName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    ownerName: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardBody: {
        marginBottom: 5,
    },
    dateTimeRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '600',
        marginRight: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94a3b8',
        marginTop: 6,
    },
    motivoText: {
        fontSize: 14,
        color: '#334155',
        marginTop: 2,
    },
    vetText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 2,
    },
    cancelButton: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    cancelButtonText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: 'bold',
    },
    manageButton: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 8,
        padding: 11,
        alignItems: 'center',
        marginTop: 15,
    },
    manageButtonText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: '100%',
        maxHeight: '85%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalScroll: {
        paddingBottom: 20,
    },
    modalTitle: {
        fontSize: 21,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 15,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
    },
    infoSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 4,
    },
    noVetsText: {
        color: '#ef4444',
        fontSize: 13,
        fontStyle: 'italic',
    },
    selectorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    selectorOption: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        margin: 4,
        backgroundColor: '#fafafa',
    },
    selectorOptionActive: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    selectorOptionText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    selectorOptionTextActive: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 15,
    },
    modalBtn: {
        flex: 1,
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelModalBtn: {
        backgroundColor: '#f1f5f9',
    },
    cancelModalBtnText: {
        color: '#475569',
        fontWeight: 'bold',
    },
    saveModalBtn: {
        backgroundColor: '#2563eb',
    },
    saveModalBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    horizontalScrollContent: {
        flexDirection: 'row',
        paddingVertical: 5,
        paddingHorizontal: 2,
    },
    tabContainer: {
        backgroundColor: '#ffffff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tabScrollContent: {
        paddingHorizontal: 16,
    },
    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginRight: 8,
    },
    tabButtonActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    emptyTabContainer: {
        alignItems: 'center',
        padding: 40,
    },
    disponiblesContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        margin: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    dateInput: {
        height: 48,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 15,
        backgroundColor: '#f8fafc',
        marginBottom: 16,
    },
    disponiblesSubTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 6,
    },
    noHoursText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        paddingVertical: 20,
    },
    hoursGrid: {
        gap: 10,
    },
    hourCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    hourText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
    },
    bookBtn: {
        backgroundColor: '#2563eb',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    bookBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
        backgroundColor: '#f8fafc',
    },
    searchInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#1e293b',
    },
});
