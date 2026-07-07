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

export default function ConsultasScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [consultas, setConsultas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form Modals
    const [consultaModalVisible, setConsultaModalVisible] = useState(false);
    const [editingConsulta, setEditingConsulta] = useState(null);
    const [loadingExpediente, setLoadingExpediente] = useState(false);

    // Form fields
    const [selectedPacienteId, setSelectedPacienteId] = useState('');
    const [activeExpediente, setActiveExpediente] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [sintomas, setSintomas] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [veterinario, setVeterinario] = useState('');
    const [pesoRegistrado, setPesoRegistrado] = useState('');
    const [temperatura, setTemperatura] = useState('');
    const [consultaErrors, setConsultaErrors] = useState({});

    // Lists loaded for selection
    const [pacientes, setPacientes] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [tipoConsulta, setTipoConsulta] = useState('emergencia'); // 'emergencia' | 'cita'
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    const loadInitialData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                // 1. Cargar Consultas
                const response = await api.get('/consultas?limit=100');
                if (response.data.success) {
                    setConsultas(response.data.data);
                }

                // 2. Cargar Pacientes para el selector
                const pacsRes = await api.get('/pacientes?limit=1000');
                if (pacsRes.data.success) {
                    setPacientes(pacsRes.data.data);
                    if (pacsRes.data.data.length > 0) {
                        setSelectedPacienteId(pacsRes.data.data[0].id.toString());
                    }
                }

                // 3. Cargar Admins (Veterinarios)
                const adminsRes = await api.get('/auth/admins');
                if (adminsRes.data.success) {
                    setAdmins(adminsRes.data.data);
                }
            }
        } catch (err) {
            console.error('Error al cargar datos en ConsultasScreen:', err);
            setError('No se pudieron cargar las consultas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    // Cada vez que cambia el paciente seleccionado en el formulario, buscamos su expediente activo
    useEffect(() => {
        if (selectedPacienteId && consultaModalVisible && !editingConsulta) {
            fetchExpedienteForPaciente(selectedPacienteId);
        }
    }, [selectedPacienteId, consultaModalVisible]);

    // Buscar el expediente asociado al paciente seleccionado
    const fetchExpedienteForPaciente = async (pacienteId) => {
        setLoadingExpediente(true);
        setActiveExpediente(null);
        setPendingAppointments([]);
        setSelectedAppointmentId('');
        try {
            const expRes = await api.get(`/expedientes/paciente/${pacienteId}`);
            if (expRes.data.success) {
                setActiveExpediente(expRes.data.data);
            }
        } catch (err) {
            console.log('Paciente sin expediente:', err.message);
        } finally {
            setLoadingExpediente(false);
        }
    };

    // Si la entrada es Con Cita, buscar las citas correspondientes
    useEffect(() => {
        if (tipoConsulta === 'cita' && selectedPacienteId && !editingConsulta) {
            fetchPatientAppointments(selectedPacienteId);
        }
    }, [tipoConsulta, selectedPacienteId]);

    const fetchPatientAppointments = async (pacienteId) => {
        setLoadingAppointments(true);
        try {
            const response = await api.get('/citas?limit=1000');
            if (response.data.success) {
                const filtered = response.data.data.filter(
                    c => c.paciente_id === parseInt(pacienteId) && 
                    (c.estado === 'pendiente' || c.estado === 'confirmada')
                );
                setPendingAppointments(filtered);
                if (filtered.length > 0) {
                    setSelectedAppointmentId(filtered[0].id.toString());
                } else {
                    setSelectedAppointmentId('');
                }
            }
        } catch (err) {
            console.error('Error al cargar citas:', err);
        } finally {
            setLoadingAppointments(false);
        }
    };

    // Abre modal para agregar
    const openAddModal = () => {
        setEditingConsulta(null);
        setMotivo('');
        setSintomas('');
        setObservaciones('');
        setVeterinario(admins.length > 0 ? admins[0].nombre : (user?.nombre || 'Dr. Admin'));
        setPesoRegistrado('');
        setTemperatura('30.0');
        setTipoConsulta('emergencia');
        setConsultaErrors({});
        if (pacientes.length > 0) {
            setSelectedPacienteId(pacientes[0].id.toString());
        }
        setConsultaModalVisible(true);
    };

    // Abre modal para editar
    const openEditModal = (consulta) => {
        setEditingConsulta(consulta);
        setMotivo(consulta.motivo || '');
        setSintomas(consulta.sintomas || '');
        setObservaciones(consulta.observaciones || '');
        setVeterinario(consulta.veterinario || (admins.length > 0 ? admins[0].nombre : 'Dr. Admin'));
        setPesoRegistrado(consulta.peso_registrado ? consulta.peso_registrado.toString() : '');
        setTemperatura(consulta.temperatura ? consulta.temperatura.toString() : '');
        setConsultaErrors({});
        setConsultaModalVisible(true);
    };

    const handleSaveConsulta = async () => {
        setConsultaErrors({});
        if (!motivo.trim()) {
            setConsultaErrors({ motivo: 'El motivo es obligatorio.' });
            return;
        }

        if (!editingConsulta && !activeExpediente) {
            showAlert('Atención', 'Este paciente no tiene una Ficha Médica (Expediente) creada. Ve al módulo de Expedientes para crearla primero.');
            return;
        }

        setActionLoading(true);
        try {
            const body = {
                fecha: editingConsulta 
                    ? new Date(editingConsulta.fecha).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                motivo: motivo.trim(),
                sintomas: sintomas.trim() || 'Ninguno',
                observaciones: observaciones.trim() || '',
                veterinario: veterinario.trim(),
                peso_registrado: pesoRegistrado ? parseFloat(pesoRegistrado) : null,
                temperatura: temperatura ? parseFloat(temperatura) : null,
            };

            if (editingConsulta) {
                // Editar Consulta
                body.expediente_id = editingConsulta.expediente_id;
                const response = await api.put(`/consultas/${editingConsulta.id}`, body);
                if (response.data.success) {
                    showAlert('Éxito', 'Consulta médica actualizada.');
                    setConsultaModalVisible(false);
                    loadInitialData();
                }
            } else {
                // Crear Consulta
                body.expediente_id = activeExpediente.id;
                const response = await api.post('/consultas', body);
                
                if (response.data.success) {
                    // Si se vinculó a una cita, marcarla completada
                    if (tipoConsulta === 'cita' && selectedAppointmentId) {
                        const appToComplete = pendingAppointments.find(a => a.id.toString() === selectedAppointmentId);
                        if (appToComplete) {
                            const rawDate = new Date(appToComplete.fecha_cita);
                            const yyyy = rawDate.getFullYear();
                            const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
                            const dd = String(rawDate.getDate()).padStart(2, '0');
                            const formattedDate = `${yyyy}-${mm}-${dd}`;

                            const updateCitaBody = {
                                paciente_id: appToComplete.paciente_id,
                                propietario_id: appToComplete.propietario_id,
                                fecha_cita: formattedDate,
                                hora_cita: appToComplete.hora_cita.substring(0, 5),
                                motivo: appToComplete.motivo || 'Consulta médica',
                                estado: 'completada',
                                veterinario_asignado: veterinario.trim()
                            };
                            await api.put(`/citas/${appToComplete.id}`, updateCitaBody);
                        }
                    }

                    showAlert('Éxito', 'Consulta médica agregada con éxito.');
                    setConsultaModalVisible(false);
                    loadInitialData();
                }
            }
        } catch (err) {
            console.error('Error al guardar consulta:', err);
            showAlert('Error', err.response?.data?.message || 'No se pudo guardar la consulta.');
        } finally {
            setActionLoading(false);
        }
    };

    const renderConsultaItem = ({ item }) => {
        return (
            <View style={styles.consultaCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.petName}>🐾 Paciente: {item.paciente_nombre || 'Paciente'}</Text>
                        <Text style={styles.ownerName}>
                            Dueño: {item.propietario_nombre || 'Juan'} {item.propietario_apellido || 'Pérez'}
                        </Text>
                    </View>
                    <Text style={styles.consultaVet}>🩺 {item.veterinario}</Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.dateRow}>
                        <Text style={styles.dateText}>📅 Fecha: {new Date(item.fecha).toLocaleDateString()}</Text>
                    </View>

                    <Text style={styles.label}>Motivo:</Text>
                    <Text style={styles.valueText}>{item.motivo}</Text>

                    <Text style={styles.label}>Síntomas:</Text>
                    <Text style={styles.valueText}>{item.sintomas || 'Ninguno'}</Text>

                    <Text style={styles.label}>Observaciones / Tratamiento:</Text>
                    <Text style={styles.valueText}>{item.observaciones || 'Ninguna'}</Text>

                    <View style={styles.statsRow}>
                        {item.peso_registrado && (
                            <Text style={styles.statText}>⚖️ Peso: {item.peso_registrado} kg</Text>
                        )}
                        {item.temperatura && (
                            <Text style={styles.statText}>🌡️ Temp: {item.temperatura} °C</Text>
                        )}
                    </View>

                    {user && user.rol === 'admin' && (
                        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                            <Text style={styles.editButtonText}>✏️ Editar Consulta</Text>
                        </TouchableOpacity>
                    )}
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
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={styles.backButton}>
                            <Text style={styles.backButtonText}>‹ Volver</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Consultas Médicas (Admin)</Text>
                    </View>
                    
                    {user && user.rol === 'admin' && (
                        <TouchableOpacity style={styles.headerAddBtn} onPress={openAddModal}>
                            <Text style={styles.headerAddBtnText}>➕ Nueva Consulta</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Buscador de Consultas */}
                {!loading && !error && (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="🔍 Buscar consulta por paciente, dueño, motivo, veterinario..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>Cargando consultas...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : consultas.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>🩺 No hay consultas médicas registradas.</Text>
                    </View>
                ) : (
                    <View style={styles.listContent}>
                        {(() => {
                            const filteredConsultas = consultas.filter(c => {
                                const q = searchQuery.toLowerCase().trim();
                                if (!q) return true;

                                const paciente = (c.paciente_nombre || '').toLowerCase();
                                const propNombre = (c.propietario_nombre || '').toLowerCase();
                                const propApellido = (c.propietario_apellido || '').toLowerCase();
                                const motivo = (c.motivo || '').toLowerCase();
                                const veterinario = (c.veterinario || '').toLowerCase();
                                const sintomas = (c.sintomas || '').toLowerCase();

                                return paciente.includes(q) || 
                                       propNombre.includes(q) || 
                                       propApellido.includes(q) || 
                                       motivo.includes(q) ||
                                       veterinario.includes(q) ||
                                       sintomas.includes(q);
                            });

                            if (filteredConsultas.length === 0) {
                                return <Text style={styles.noDataText}>No se encontraron consultas con esta búsqueda.</Text>;
                            }

                            return filteredConsultas.map((item) => (
                                <React.Fragment key={item.id}>
                                    {renderConsultaItem({ item })}
                                </React.Fragment>
                            ));
                        })()}
                    </View>
                )}
            </ScrollView>

            {/* Modal de Registro/Edición de Consulta */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={consultaModalVisible}
                onRequestClose={() => setConsultaModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingConsulta ? '✏️ Editar Consulta' : '🩺 Registrar Consulta'}
                        </Text>
                        <ScrollView contentContainerStyle={styles.modalScroll} persistentScrollbar={true}>
                            
                            {!editingConsulta && (
                                <>
                                    {/* Elegir Paciente */}
                                    <Text style={styles.label}>Seleccionar Paciente *</Text>
                                    {pacientes.length === 0 ? (
                                        <Text style={styles.noDataText}>No hay pacientes disponibles.</Text>
                                    ) : (
                                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                            {pacientes.map((p) => (
                                                <TouchableOpacity
                                                    key={p.id}
                                                    style={[
                                                        styles.selectorOption,
                                                        selectedPacienteId === p.id.toString() && styles.selectorOptionActive
                                                    ]}
                                                    onPress={() => setSelectedPacienteId(p.id.toString())}
                                                >
                                                    <Text style={[
                                                        styles.selectorOptionText,
                                                        selectedPacienteId === p.id.toString() && styles.selectorOptionTextActive
                                                    ]}>
                                                        🐾 {p.nombre} ({p.especie})
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}

                                    {/* Comprobación de expediente */}
                                    {loadingExpediente ? (
                                        <ActivityIndicator size="small" color="#2563eb" style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
                                    ) : !activeExpediente ? (
                                        <View style={styles.warningBanner}>
                                            <Text style={styles.warningText}>
                                                ⚠️ Esta mascota no tiene un expediente clínico creado. Debes crearlo primero en el módulo de Expedientes para poder agregar una consulta.
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.infoBanner}>
                                            <Text style={styles.infoText}>
                                                Ficha Médica Encontrada (ID: {activeExpediente.id})
                                            </Text>
                                        </View>
                                    )}

                                    {/* Tipo de Entrada */}
                                    <Text style={styles.label}>Tipo de Consulta *</Text>
                                    <View style={styles.selectorRow}>
                                        <TouchableOpacity
                                            style={[
                                                styles.selectorOption,
                                                tipoConsulta === 'emergencia' && styles.selectorOptionActive
                                            ]}
                                            onPress={() => setTipoConsulta('emergencia')}
                                        >
                                            <Text style={[
                                                styles.selectorOptionText,
                                                tipoConsulta === 'emergencia' && styles.selectorOptionTextActive
                                            ]}>
                                                🚨 Emergencia (Sin Cita)
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.selectorOption,
                                                tipoConsulta === 'cita' && styles.selectorOptionActive
                                            ]}
                                            onPress={() => setTipoConsulta('cita')}
                                        >
                                            <Text style={[
                                                styles.selectorOptionText,
                                                tipoConsulta === 'cita' && styles.selectorOptionTextActive
                                            ]}>
                                                📅 Con Cita Programada
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Selector de Citas si es con cita */}
                                    {tipoConsulta === 'cita' && (
                                        <>
                                            <Text style={styles.label}>Selecciona la Cita correspondiente *</Text>
                                            {loadingAppointments ? (
                                                <ActivityIndicator size="small" color="#2563eb" style={{ alignSelf: 'flex-start' }} />
                                            ) : pendingAppointments.length === 0 ? (
                                                <Text style={styles.noAppointmentsText}>
                                                    ⚠️ Esta mascota no tiene citas PENDIENTES o CONFIRMADAS para hoy.
                                                </Text>
                                            ) : (
                                                <View style={styles.appointmentSelectorContainer}>
                                                    {pendingAppointments.map((app) => (
                                                        <TouchableOpacity
                                                            key={app.id}
                                                            style={[
                                                                styles.appointmentOption,
                                                                selectedAppointmentId === app.id.toString() && styles.appointmentOptionActive
                                                            ]}
                                                            onPress={() => setSelectedAppointmentId(app.id.toString())}
                                                        >
                                                            <Text style={styles.appointmentOptionText}>
                                                                📅 {new Date(app.fecha_cita).toLocaleDateString()} a las {app.hora_cita.substring(0,5)}
                                                                {"\n"}Motivo: {app.motivo}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            <Text style={styles.label}>Motivo *</Text>
                            <TextInput 
                                style={[styles.input, consultaErrors.motivo && styles.inputErr]}
                                placeholder="Ej. Chequeo de control, decaimiento"
                                value={motivo}
                                onChangeText={setMotivo}
                            />
                            {consultaErrors.motivo && <Text style={styles.formErrorText}>{consultaErrors.motivo}</Text>}

                            <Text style={styles.label}>Síntomas</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Síntomas observados..."
                                value={sintomas}
                                onChangeText={setSintomas}
                            />

                            <Text style={styles.label}>Observaciones y Tratamiento Recetado</Text>
                            <TextInput 
                                style={[styles.input, styles.textArea]}
                                placeholder="Diagnóstico detallado y recetas..."
                                value={observaciones}
                                onChangeText={setObservaciones}
                                multiline
                                numberOfLines={4}
                            />

                            {/* Veterinario Asignado */}
                            <Text style={styles.label}>Médico / Veterinario (Admin Registrado) *</Text>
                            {admins.length === 0 ? (
                                <Text style={styles.noDataText}>Cargando veterinarios...</Text>
                            ) : (
                                <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                    {admins.map((admin) => (
                                        <TouchableOpacity
                                            key={admin.id}
                                            style={[
                                                styles.selectorOption,
                                                veterinario === admin.nombre && styles.selectorOptionActive
                                            ]}
                                            onPress={() => setVeterinario(admin.nombre)}
                                        >
                                            <Text style={[
                                                styles.selectorOptionText,
                                                veterinario === admin.nombre && styles.selectorOptionTextActive
                                            ]}>
                                                👨‍⚕️ {admin.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            <Text style={styles.label}>Peso Registrado (kg)</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Ej. 1.85"
                                value={pesoRegistrado}
                                onChangeText={setPesoRegistrado}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Temperatura (°C)</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Ej. 30.5"
                                value={temperatura}
                                onChangeText={setTemperatura}
                                keyboardType="numeric"
                            />
                        </ScrollView>

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelModalBtn]} 
                                onPress={() => setConsultaModalVisible(false)}
                            >
                                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.saveModalBtn]} 
                                onPress={handleSaveConsulta}
                                disabled={actionLoading || (!editingConsulta && !activeExpediente) || (tipoConsulta === 'cita' && !selectedAppointmentId && !editingConsulta)}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveModalBtnText}>
                                        {editingConsulta ? 'Guardar Cambios' : 'Registrar Consulta'}
                                    </Text>
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
        padding: 5,
    },
    backButtonText: {
        color: '#2563eb',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 15,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAddBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    headerAddBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13,
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
    consultaCard: {
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
    consultaVet: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2563eb',
    },
    cardBody: {
        marginBottom: 5,
    },
    dateRow: {
        marginBottom: 10,
    },
    dateText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94a3b8',
        marginTop: 15,
        marginBottom: 3,
    },
    valueText: {
        fontSize: 14,
        color: '#334155',
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
        marginBottom: 12,
    },
    statText: {
        fontSize: 12,
        color: '#64748b',
        marginRight: 20,
        fontWeight: '600',
    },
    editButton: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#2563eb',
        fontSize: 13,
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
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    inputErr: {
        borderColor: '#ef4444',
    },
    formErrorText: {
        color: '#ef4444',
        fontSize: 11,
        marginTop: 2,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    selectorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
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
    noDataText: {
        color: '#64748b',
        fontStyle: 'italic',
    },
    warningBanner: {
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fef3c7',
        borderRadius: 8,
        padding: 10,
        marginVertical: 10,
    },
    warningText: {
        color: '#b45309',
        fontSize: 12,
        lineHeight: 16,
    },
    infoBanner: {
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        padding: 10,
        marginVertical: 10,
    },
    infoText: {
        color: '#16a34a',
        fontSize: 12,
        fontWeight: 'bold',
    },
    noAppointmentsText: {
        color: '#ef4444',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 5,
        marginBottom: 10,
    },
    appointmentSelectorContainer: {
        marginTop: 8,
        marginBottom: 15,
    },
    appointmentOption: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fafafa',
        marginBottom: 8,
    },
    appointmentOptionActive: {
        borderColor: '#16a34a',
        backgroundColor: '#f0fdf4',
    },
    appointmentOptionText: {
        fontSize: 12,
        color: '#334155',
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
