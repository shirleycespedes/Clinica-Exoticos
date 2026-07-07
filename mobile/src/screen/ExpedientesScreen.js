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
    TextInput,
    Alert,
    Platform,
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

const getAnimalEmoji = (tipo, especie = '', nombre = '') => {
    const t = tipo || '';
    const e = (especie || '').toLowerCase();
    const n = (nombre || '').toLowerCase();
    
    if (t === 'Reptil') {
        if (e.includes('serpiente') || e.includes('culebra') || e.includes('piton') || e.includes('boa') || e.includes('viper') || e.includes('python') || e.includes('snake') ||
            n.includes('serpiente') || n.includes('culebra')) {
            return '🐍';
        }
        if (e.includes('tortuga') || e.includes('turtle') || n.includes('tortuga') || n.includes('turtle')) {
            return '🐢';
        }
        return '🦎';
    }
    if (t === 'Ave') return '🦜';
    if (t === 'Anfibio') return '🐸';
    if (t === 'Mamifero_Exotico') return '🦔';
    if (t === 'Aracnido') return '🕷️';
    return '🐾';
};

export default function ExpedientesScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [mascotas, setMascotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMascota, setSelectedMascota] = useState(null);
    const [expediente, setExpediente] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Header Add Mode States
    const [headerAddMode, setHeaderAddMode] = useState(false);
    const [selectedPacienteIdForFicha, setSelectedPacienteIdForFicha] = useState('');

    // Admin Ficha Médica Form States
    const [fichaModalVisible, setFichaModalVisible] = useState(false);
    const [fichaLoading, setFichaLoading] = useState(false);
    const [notasGenerales, setNotasGenerales] = useState('');
    const [alergias, setAlergias] = useState('');
    const [enfermedadesCronicas, setEnfermedadesCronicas] = useState('');
    const [vacunas, setVacunas] = useState('');

    const loadUserAndMascotas = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                
                const endpoint = parsedUser.rol === 'admin' ? '/pacientes?limit=1000' : '/pacientes/mis-pacientes';
                const response = await api.get(endpoint);
                
                if (response.data.success) {
                    setMascotas(response.data.data);
                }
            }
        } catch (err) {
            console.error('Error al cargar mascotas para expedientes:', err);
            setError('No se pudieron cargar las mascotas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserAndMascotas();
    }, []);

    const fetchExpedienteDetails = async (mascota) => {
        setSelectedMascota(mascota);
        setLoadingDetails(true);
        setExpediente(null);
        setDetailModalVisible(true);

        try {
            const expRes = await api.get(`/expedientes/paciente/${mascota.id}`);
            if (expRes.data.success) {
                setExpediente(expRes.data.data);
            }
        } catch (err) {
            console.log('El paciente no tiene expediente todavía:', err.message);
        } finally {
            setLoadingDetails(false);
        }
    };

    const openCreateFichaFromHeader = () => {
        setHeaderAddMode(true);
        setExpediente(null);
        setNotasGenerales('');
        setAlergias('');
        setEnfermedadesCronicas('');
        setVacunas('');
        
        const availableMascotas = mascotas.filter(m => !m.expediente_id);
        if (availableMascotas.length > 0) {
            setSelectedPacienteIdForFicha(availableMascotas[0].id.toString());
        } else {
            setSelectedPacienteIdForFicha('');
        }
        setFichaModalVisible(true);
    };

    const openFichaModal = () => {
        setHeaderAddMode(false);
        if (expediente) {
            setNotasGenerales(expediente.notas_generales || '');
            setAlergias(expediente.alergias || '');
            setEnfermedadesCronicas(expediente.enfermedades_cronicas || '');
            setVacunas(expediente.vacunas || '');
        } else {
            setNotasGenerales('');
            setAlergias('');
            setEnfermedadesCronicas('');
            setVacunas('');
        }
        setFichaModalVisible(true);
    };

    const handleSaveFicha = async () => {
        setFichaLoading(true);
        try {
            const pacienteId = headerAddMode 
                ? parseInt(selectedPacienteIdForFicha) 
                : selectedMascota.id;

            const body = {
                paciente_id: pacienteId,
                alergias: alergias.trim() || 'Ninguna',
                enfermedades_cronicas: enfermedadesCronicas.trim() || 'Ninguna',
                vacunas: vacunas.trim() || 'Ninguna',
                notas_generales: notasGenerales.trim() || '',
            };

            let response;
            if (!headerAddMode && expediente) {
                response = await api.put(`/expedientes/${expediente.id}`, body);
            } else {
                body.fecha_apertura = new Date().toISOString().split('T')[0];
                response = await api.post('/expedientes', body);
            }

            if (response.data.success) {
                showAlert('Éxito', (!headerAddMode && expediente) ? 'Expediente actualizado.' : 'Expediente creado correctamente.');
                setFichaModalVisible(false);
                if (headerAddMode) {
                    loadUserAndMascotas();
                } else {
                    fetchExpedienteDetails(selectedMascota);
                }
            }
        } catch (err) {
            console.error('Error al guardar expediente:', err);
            showAlert('Error', err.response?.data?.message || 'No se pudo guardar la información.');
        } finally {
            setFichaLoading(false);
        }
    };

    const handleEliminarExpediente = async (expedienteId) => {
        const proceed = Platform.OS === 'web' 
            ? confirm('¿Estás seguro de que deseas eliminar este expediente médico permanentemente? Esta acción no se puede deshacer.')
            : await new Promise(resolve => {
                Alert.alert(
                    'Confirmar Eliminación',
                    '¿Estás seguro de que deseas eliminar este expediente médico permanentemente? Esta acción no se puede deshacer.',
                    [
                        { text: 'Cancelar', onPress: () => resolve(false), style: 'cancel' },
                        { text: 'Eliminar', onPress: () => resolve(true), style: 'destructive' }
                    ]
                );
            });

        if (proceed) {
            try {
                const response = await api.delete(`/expedientes/${expedienteId}`);
                if (response.data.success) {
                    showAlert('Éxito', 'Expediente eliminado correctamente.');
                    setDetailModalVisible(false);
                    loadUserAndMascotas();
                }
            } catch (err) {
                console.error('Error al eliminar expediente:', err);
                showAlert('Error', err.response?.data?.message || 'No se pudo eliminar el expediente.');
            }
        }
    };

    const renderMascotaItem = ({ item }) => {
        const emoji = getAnimalEmoji(item.tipo_animal, item.especie, item.nombre);
        
        return (
            <TouchableOpacity style={styles.mascotaCard} onPress={() => fetchExpedienteDetails(item)}>
                <Text style={styles.mascotaEmoji}>{emoji}</Text>
                <View style={styles.mascotaInfo}>
                    <Text style={styles.mascotaName}>Expediente de {item.nombre}</Text>
                    <Text style={styles.mascotaSpecie}>{item.especie}</Text>
                </View>
                <Text style={styles.viewMoreText}>Ver Ficha ›</Text>
            </TouchableOpacity>
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
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={styles.backButton}>
                            <Text style={styles.backButtonText}>‹ Volver</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            {user && user.rol === 'admin' ? 'Expedientes Clínicos' : 'Mis Expedientes'}
                        </Text>
                    </View>
                    {user && user.rol === 'admin' && (
                        <TouchableOpacity style={styles.headerAddButton} onPress={openCreateFichaFromHeader}>
                            <Text style={styles.headerAddButtonText}>➕ Crear Expediente</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Buscador de Expedientes */}
                {!loading && !error && (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="🔍 Buscar expediente por paciente, especie, dueño..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>Cargando expedientes...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : mascotas.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>📂 No hay expedientes disponibles.</Text>
                    </View>
                ) : (
                    <View style={styles.listContent}>
                        {(() => {
                            const filteredMascotas = mascotas.filter(m => {
                                const q = searchQuery.toLowerCase().trim();
                                if (!q) return true;

                                const nombre = (m.nombre || '').toLowerCase();
                                const especie = (m.especie || '').toLowerCase();
                                const propNombre = (m.propietario_nombre || '').toLowerCase();
                                const propApellido = (m.propietario_apellido || '').toLowerCase();
                                const tipo = (m.tipo_animal || '').toLowerCase();

                                return nombre.includes(q) || 
                                       especie.includes(q) || 
                                       propNombre.includes(q) || 
                                       propApellido.includes(q) || 
                                       tipo.includes(q);
                            });

                            if (filteredMascotas.length === 0) {
                                return <Text style={styles.noDataText}>No se encontraron expedientes con esta búsqueda.</Text>;
                            }

                            return filteredMascotas.map((item) => (
                                <React.Fragment key={item.id}>
                                    {renderMascotaItem({ item })}
                                </React.Fragment>
                            ));
                        })()}
                    </View>
                )}
            </ScrollView>

            {/* Modal de Detalle de Expediente (Ficha Médica General) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailModalVisible}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {loadingDetails ? (
                            <View style={styles.loadingDetailsContainer}>
                                <ActivityIndicator size="large" color="#2563eb" />
                                <Text style={styles.loadingText}>Cargando ficha médica...</Text>
                            </View>
                        ) : (
                            <ScrollView contentContainerStyle={styles.modalScroll} persistentScrollbar={true}>
                                {selectedMascota && (
                                    <>
                                        <Text style={styles.modalTitle}>📂 Expediente: {selectedMascota.nombre}</Text>
                                        
                                        {expediente ? (
                                            <View style={styles.sectionCard}>
                                                <View style={styles.sectionHeaderRow}>
                                                    <Text style={styles.sectionCardTitle}>Ficha Médica General</Text>
                                                     {user && user.rol === 'admin' && (
                                                         <View style={{ flexDirection: 'row' }}>
                                                             <TouchableOpacity style={styles.editBadge} onPress={openFichaModal}>
                                                                 <Text style={styles.editBadgeText}>✏️ Editar</Text>
                                                             </TouchableOpacity>
                                                             <TouchableOpacity 
                                                                 style={[styles.editBadge, { backgroundColor: '#fee2e2', marginLeft: 8 }]} 
                                                                 onPress={() => handleEliminarExpediente(expediente.id)}
                                                             >
                                                                 <Text style={[styles.editBadgeText, { color: '#ef4444' }]}>🗑️ Eliminar</Text>
                                                             </TouchableOpacity>
                                                         </View>
                                                     )}
                                                </View>
                                                
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel}>F. Apertura:</Text>
                                                    <Text style={styles.detailValue}>
                                                        {new Date(expediente.fecha_apertura).toLocaleDateString()}
                                                    </Text>
                                                </View>

                                                <View style={styles.detailColumn}>
                                                    <Text style={styles.detailLabelCol}>Alergias:</Text>
                                                    <Text style={styles.detailValueCol}>{expediente.alergias}</Text>
                                                </View>

                                                <View style={styles.detailColumn}>
                                                    <Text style={styles.detailLabelCol}>Enfermedades Crónicas:</Text>
                                                    <Text style={styles.detailValueCol}>{expediente.enfermedades_cronicas}</Text>
                                                </View>

                                                <View style={styles.detailColumn}>
                                                    <Text style={styles.detailLabelCol}>Vacunas / Tratamientos:</Text>
                                                    <Text style={styles.detailValueCol}>{expediente.vacunas}</Text>
                                                </View>

                                                <View style={styles.detailColumn}>
                                                    <Text style={styles.detailLabelCol}>Notas Generales:</Text>
                                                    <Text style={styles.detailValueCol}>{expediente.notas_generales || 'Sin notas.'}</Text>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={styles.noExpedienteCard}>
                                                <Text style={styles.noExpedienteText}>
                                                    ⚠️ Este paciente no cuenta con una Ficha Médica activa todavía.
                                                </Text>
                                                {user && user.rol === 'admin' && (
                                                    <TouchableOpacity style={styles.createFichaBtn} onPress={openFichaModal}>
                                                        <Text style={styles.createFichaBtnText}>Crear Ficha Médica</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </>
                                )}
                            </ScrollView>
                        )}
                        <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Crear/Editar Ficha Médica (Solo Admin) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={fichaModalVisible}
                onRequestClose={() => setFichaModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>✏️ Ficha Médica</Text>
                        <ScrollView contentContainerStyle={styles.modalScroll} persistentScrollbar={true}>
                            {headerAddMode && (
                                <>
                                    <Text style={styles.label}>Seleccionar Paciente *</Text>
                                    {mascotas.filter(m => !m.expediente_id).length === 0 ? (
                                        <Text style={styles.noDataText}>No hay pacientes sin expediente médico activo.</Text>
                                    ) : (
                                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                            {mascotas.filter(m => !m.expediente_id).map((m) => (
                                                <TouchableOpacity
                                                    key={m.id}
                                                    style={[
                                                        styles.selectorOption,
                                                        selectedPacienteIdForFicha === m.id.toString() && styles.selectorOptionActive
                                                    ]}
                                                    onPress={() => setSelectedPacienteIdForFicha(m.id.toString())}
                                                >
                                                    <Text style={[
                                                        styles.selectorOptionText,
                                                        selectedPacienteIdForFicha === m.id.toString() && styles.selectorOptionTextActive
                                                    ]}>
                                                        🐾 {m.nombre} ({m.especie})
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </>
                            )}

                            <Text style={styles.label}>Alergias</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Ej. Ninguna conocida o Alergia a penicilina"
                                value={alergias}
                                onChangeText={setAlergias}
                            />

                            <Text style={styles.label}>Enfermedades Crónicas</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Ej. Insuficiencia renal"
                                value={enfermedadesCronicas}
                                onChangeText={setEnfermedadesCronicas}
                            />

                            <Text style={styles.label}>Vacunas / Tratamientos al día</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Ej. Desparasitación interna"
                                value={vacunas}
                                onChangeText={setVacunas}
                            />

                            <Text style={styles.label}>Notas Generales</Text>
                            <TextInput 
                                style={[styles.input, styles.textArea]}
                                placeholder="Notas clínicas de control..."
                                value={notasGenerales}
                                onChangeText={setNotasGenerales}
                                multiline
                                numberOfLines={4}
                            />
                        </ScrollView>

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelModalBtn]} 
                                onPress={() => setFichaModalVisible(false)}
                            >
                                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.saveModalBtn]} 
                                onPress={handleSaveFicha}
                                disabled={fichaLoading}
                            >
                                {fichaLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveModalBtnText}>Guardar</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        flexWrap: 'wrap',
        gap: 10,
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
    loadingDetailsContainer: {
        padding: 40,
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
    mascotaCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    mascotaEmoji: {
        fontSize: 36,
        marginRight: 15,
    },
    mascotaInfo: {
        flex: 1,
    },
    mascotaName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    mascotaSpecie: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    viewMoreText: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '600',
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
        maxHeight: '90%',
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
    sectionCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    editBadge: {
        backgroundColor: '#eff6ff',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    editBadgeText: {
        color: '#2563eb',
        fontSize: 11,
        fontWeight: 'bold',
    },
    noExpedienteCard: {
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fef3c7',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    noExpedienteText: {
        color: '#b45309',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
    createFichaBtn: {
        backgroundColor: '#d97706',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    createFichaBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    detailColumn: {
        marginTop: 10,
    },
    detailLabelCol: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 2,
    },
    detailValueCol: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
        lineHeight: 18,
    },
    closeButton: {
        backgroundColor: '#2563eb',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginTop: 15,
    },
    closeButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginTop: 15,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 25,
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAddButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    headerAddButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    horizontalScrollContent: {
        flexDirection: 'row',
        paddingVertical: 5,
        paddingHorizontal: 2,
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
    noDataText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        paddingVertical: 30,
    },
});
