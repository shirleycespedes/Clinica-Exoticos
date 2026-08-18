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

export default function MascotasScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [mascotas, setMascotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMascota, setSelectedMascota] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Consultas Read-Only States
    const [consultasModalVisible, setConsultasModalVisible] = useState(false);
    const [consultas, setConsultas] = useState([]);
    const [loadingConsultas, setLoadingConsultas] = useState(false);

    // Admin Specific States
    const [propietarios, setPropietarios] = useState([]);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Selección de usuario para crear nuevo dueño
    const [registeredUsers, setRegisteredUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');

    // Modo Propietario ('existente' o 'nuevo')
    const [propietarioModo, setPropietarioModo] = useState('existente');
    const [propNuevoNombre, setPropNuevoNombre] = useState('');
    const [propNuevoApellido, setPropNuevoApellido] = useState('');
    const [propNuevoCedula, setPropNuevoCedula] = useState('');
    const [propNuevoTelefono, setPropNuevoTelefono] = useState('');
    const [propNuevoEmail, setPropNuevoEmail] = useState('');

    // Add Form Fields
    const [nombre, setNombre] = useState('');
    const [especie, setEspecie] = useState('');
    const [tipoAnimal, setTipoAnimal] = useState('Reptil');
    const [selectedPropietario, setSelectedPropietario] = useState('');
    const [sexo, setSexo] = useState('Macho');
    const [peso, setPeso] = useState('');
    const [habitat, setHabitat] = useState('');
    const [dieta, setDieta] = useState([]);
    const [dietaOtro, setDietaOtro] = useState('');
    const [microchip, setMicrochip] = useState('');

    // Error states for form
    const [formErrors, setFormErrors] = useState({});

    const autoFillFromUser = (userObj) => {
        if (!userObj) return;
        const nameParts = (userObj.nombre || '').trim().split(/\s+/);
        setPropNuevoNombre(nameParts[0] || '');
        setPropNuevoApellido(nameParts.slice(1).join(' ') || 'Cliente');
        setPropNuevoTelefono(userObj.telefono || '');
        setPropNuevoEmail(userObj.email || '');
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

                // Si es admin, cargar la lista de propietarios de antemano para poder agregar
                if (parsedUser.rol === 'admin') {
                    const propResponse = await api.get('/propietarios?limit=100');
                    if (propResponse.data.success) {
                        setPropietarios(propResponse.data.data);
                        if (propResponse.data.data.length > 0) {
                            setSelectedPropietario(propResponse.data.data[0].id.toString());
                        }
                    }

                    // Cargar usuarios clientes
                    const usersResponse = await api.get('/auth/users');
                    if (usersResponse.data.success) {
                        const clientsList = usersResponse.data.data.filter(u => u.rol === 'cliente' && !u.propietario_id);
                        setRegisteredUsers(clientsList);
                        if (clientsList.length > 0) {
                            setSelectedUserId(clientsList[0].id.toString());
                            // Auto-rellenar con el primer usuario
                            const nameParts = (clientsList[0].nombre || '').trim().split(/\s+/);
                            setPropNuevoNombre(nameParts[0] || '');
                            setPropNuevoApellido(nameParts.slice(1).join(' ') || 'Cliente');
                            setPropNuevoTelefono(clientsList[0].telefono || '');
                            setPropNuevoEmail(clientsList[0].email || '');
                        } else {
                            setSelectedUserId('');
                            setPropNuevoNombre('');
                            setPropNuevoApellido('');
                            setPropNuevoTelefono('');
                            setPropNuevoEmail('');
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error al cargar datos en Mascotas:', err);
            setError('No se pudieron cargar los datos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserAndMascotas();
    }, []);

    const openMascotaDetails = (mascota) => {
        setSelectedMascota(mascota);
        setDetailModalVisible(true);
    };

    const openConsultasModal = async (pacienteId) => {
        setLoadingConsultas(true);
        setConsultas([]);
        setConsultasModalVisible(true);
        try {
            const response = await api.get(`/consultas/paciente/${pacienteId}`);
            if (response.data.success) {
                setConsultas(response.data.data);
            }
        } catch (err) {
            console.error('Error al cargar consultas del paciente:', err);
        } finally {
            setLoadingConsultas(false);
        }
    };

    const handleEliminarMascota = async (mascotaId) => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm('¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.');
            if (confirm) executeDelete(mascotaId);
        } else {
            Alert.alert(
                'Eliminar Paciente',
                '¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => executeDelete(mascotaId) }
                ]
            );
        }
    };

    const executeDelete = async (mascotaId) => {
        setActionLoading(true);
        try {
            const response = await api.delete(`/pacientes/${mascotaId}`);
            if (response.data.success) {
                showAlert('Éxito', 'Paciente eliminado correctamente.');
                setDetailModalVisible(false);
                loadUserAndMascotas();
            }
        } catch (err) {
            console.error('Error al eliminar paciente:', err);
            showAlert('Error', err.response?.data?.message || 'No se pudo eliminar el paciente.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddPaciente = async () => {
        setFormErrors({});
        let errors = {};
        
        if (!nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
        if (!especie.trim()) errors.especie = 'La especie es obligatoria.';
        if (microchip.trim() && !/^[a-zA-Z0-9.\-\/\s]+$/.test(microchip.trim())) {
            errors.microchip = 'El microchip solo puede contener letras, números, puntos, guiones y barras.';
        }

        if (dieta.includes('Otro') && !dietaOtro.trim()) {
            errors.dietaOtro = 'Debes especificar la otra dieta.';
        }
        
        if (propietarioModo === 'existente') {
            if (!selectedPropietario) errors.propietario = 'Debes seleccionar un propietario.';
        } else {
            if (!selectedUserId) errors.selectedUserId = 'Debes seleccionar un usuario.';
            if (!propNuevoCedula.trim()) {
                errors.propNuevoCedula = 'La cédula del propietario es obligatoria.';
            } else if (!/^[0-9-]+$/.test(propNuevoCedula.trim())) {
                errors.propNuevoCedula = 'La cédula solo debe contener números y guiones.';
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setAddLoading(true);
        try {
            let propietarioId = null;
            
            if (propietarioModo === 'existente') {
                propietarioId = parseInt(selectedPropietario);
            } else {
                // Crear propietario a partir de los datos del usuario seleccionado
                const propBody = {
                    usuario_id: parseInt(selectedUserId),
                    nombre: propNuevoNombre,
                    apellido: propNuevoApellido,
                    cedula: propNuevoCedula.trim(),
                    telefono: propNuevoTelefono || null,
                    email: propNuevoEmail
                };
                
                const propResponse = await api.post('/propietarios', propBody);
                if (propResponse.data.success) {
                    propietarioId = propResponse.data.data.id;
                } else {
                    throw new Error('No se pudo registrar el propietario.');
                }
            }

            // Construct the diet string from selection array and custom text
            let dietString = '';
            const selectedDiets = [...dieta];
            if (selectedDiets.length > 0) {
                const finalDiets = selectedDiets.map(d => {
                    if (d === 'Otro') {
                        return dietaOtro.trim() ? `Otro: ${dietaOtro.trim()}` : 'Otro';
                    }
                    return d;
                });
                dietString = finalDiets.join(', ');
            }

            const body = {
                nombre: nombre.trim(),
                especie: especie.trim(),
                tipo_animal: tipoAnimal,
                propietario_id: propietarioId,
                sexo,
                peso: peso ? parseFloat(peso) : null,
                habitat: habitat.trim() || null,
                dieta: dietString || null,
                microchip: microchip.trim() || null
            };

            const response = await api.post('/pacientes', body);
            if (response.data.success) {
                showAlert('Éxito', 'Paciente agregado correctamente.');
                
                // Reset form fields
                setNombre('');
                setEspecie('');
                setPeso('');
                setHabitat('');
                setDieta([]);
                setDietaOtro('');
                setMicrochip('');
                setPropNuevoNombre('');
                setPropNuevoApellido('');
                setPropNuevoCedula('');
                setPropNuevoTelefono('');
                setPropNuevoEmail('');
                setPropietarioModo('existente');
                
                setAddModalVisible(false);
                loadUserAndMascotas();
            }
        } catch (err) {
            console.error('Error al registrar paciente:', err);
            const msg = err.response?.data?.message || err.message || 'No se pudo registrar el paciente.';
            showAlert('Error', msg);
        } finally {
            setAddLoading(false);
        }
    };

    const renderMascotaItem = ({ item }) => {
        const emoji = getAnimalEmoji(item.tipo_animal, item.especie, item.nombre);

        return (
            <TouchableOpacity style={styles.mascotaCard} onPress={() => openMascotaDetails(item)}>
                <Text style={styles.mascotaEmoji}>{emoji}</Text>
                <View style={styles.mascotaInfo}>
                    <Text style={styles.mascotaName}>{item.nombre}</Text>
                    <Text style={styles.mascotaSpecie}>{item.especie}</Text>
                </View>
                <Text style={styles.viewMoreText}>Ver detalle ›</Text>
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
                    <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹ Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {user && user.rol === 'admin' ? 'Pacientes (Admin)' : 'Mis Mascotas'}
                    </Text>
                    
                    {user && user.rol === 'admin' && (
                        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
                            <Text style={styles.addButtonText}>➕ Agregar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {!loading && !error && (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="🔍 Buscar paciente por nombre, especie, dueño..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#94a3b8"
                        />
                        {/* Export Buttons */}
                        {user && user.rol === 'admin' && (
                            <View style={styles.exportButtonsContainer}>
                                <TouchableOpacity 
                                    style={[styles.exportBtn, styles.exportExcelBtn]} 
                                    onPress={() => handleExport('excel', 'pacientes')}
                                >
                                    <Text style={styles.exportExcelBtnText}>📊 Exportar Excel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.exportBtn, styles.exportPdfBtn]} 
                                    onPress={() => handleExport('pdf', 'pacientes')}
                                >
                                    <Text style={styles.exportPdfBtnText}>📄 Exportar PDF</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>Cargando pacientes...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                ) : mascotas.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>🐾 No hay pacientes en el sistema.</Text>
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
                                return <Text style={styles.noDataText}>No se encontraron pacientes con esta búsqueda.</Text>;
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

            {/* Modal de Detalle */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailModalVisible}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView contentContainerStyle={styles.modalScroll} persistentScrollbar={true}>
                            {selectedMascota && (
                                <>
                                    <Text style={styles.modalTitle}>🐾 Ficha de Paciente</Text>
                                    
                                    <View style={styles.modalExportButtonsContainer}>
                                        <TouchableOpacity 
                                            style={[styles.exportBtn, styles.exportExcelBtn]} 
                                            onPress={() => handleExport('excel', 'pacientes', selectedMascota.id)}
                                        >
                                            <Text style={styles.exportExcelBtnText}>📊 Exportar Excel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.exportBtn, styles.exportPdfBtn]} 
                                            onPress={() => handleExport('pdf', 'pacientes', selectedMascota.id)}
                                        >
                                            <Text style={styles.exportPdfBtnText}>📄 Exportar PDF</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Nombre:</Text>
                                        <Text style={styles.detailValue}>{selectedMascota.nombre}</Text>
                                    </View>
                                    
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Especie:</Text>
                                        <Text style={styles.detailValue}>{selectedMascota.especie}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Grupo:</Text>
                                        <Text style={styles.detailValue}>{selectedMascota.tipo_animal}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Sexo:</Text>
                                        <Text style={styles.detailValue}>{selectedMascota.sexo || 'Indeterminado'}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Peso:</Text>
                                        <Text style={styles.detailValue}>{selectedMascota.peso ? `${selectedMascota.peso} kg` : 'No registrado'}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Hábitat:</Text>
                                        <Text style={styles.detailValue}>{selectedMascota.habitat || 'No registrado'}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Dieta:</Text>
                                        <Text style={styles.detailValue}>{selectedMascota.dieta || 'No registrado'}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Microchip:</Text>
                                        <Text style={styles.detailValue}>{selectedMascota.microchip || 'No posee'}</Text>
                                    </View>

                                    {/* Datos del Propietario (Visible para todos) */}
                                    <View style={styles.ownerCardSection}>
                                        <Text style={styles.sectionSubTitle}>👤 Datos del Propietario / Dueño</Text>
                                        
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Nombre:</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedMascota.propietario_nombre 
                                                    ? `${selectedMascota.propietario_nombre} ${selectedMascota.propietario_apellido || ''}` 
                                                    : 'No registrado'}
                                            </Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Cédula:</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedMascota.propietario_cedula || 'No registrada'}
                                            </Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Teléfono:</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedMascota.propietario_telefono || 'No registrado'}
                                            </Text>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Email:</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedMascota.propietario_email || 'No registrado'}
                                            </Text>
                                        </View>

                                        {/* Botón de Consultas (Solo Lectura) */}
                                        <TouchableOpacity 
                                            style={styles.consultasButton} 
                                            onPress={() => openConsultasModal(selectedMascota.id)}
                                        >
                                            <Text style={styles.consultasButtonText}>🩺 Historial de Consultas</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Acciones de Control */}
                                    <View style={styles.adminSection}>
                                        <TouchableOpacity 
                                            style={styles.deleteButton} 
                                            onPress={() => handleEliminarMascota(selectedMascota.id)}
                                            disabled={actionLoading}
                                        >
                                            <Text style={styles.deleteButtonText}>Eliminar Mascota</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal de Historial de Consultas del Paciente (Solo Lectura) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={consultasModalVisible}
                onRequestClose={() => setConsultasModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            🩺 Consultas de {selectedMascota?.nombre}
                        </Text>
                        
                        {!loadingConsultas && consultas.length > 0 && (
                            <View style={styles.modalExportButtonsContainer}>
                                <TouchableOpacity 
                                    style={[styles.exportBtn, styles.exportExcelBtn]} 
                                    onPress={() => handleExport('excel', 'consultas', selectedMascota?.id)}
                                >
                                    <Text style={styles.exportExcelBtnText}>📊 Exportar Excel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.exportBtn, styles.exportPdfBtn]} 
                                    onPress={() => handleExport('pdf', 'consultas', selectedMascota?.id)}
                                >
                                    <Text style={styles.exportPdfBtnText}>📄 Exportar PDF</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {loadingConsultas ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#2563eb" />
                                <Text style={styles.loadingText}>Cargando historial clínico...</Text>
                            </View>
                        ) : consultas.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    No hay consultas médicas registradas para este paciente.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView contentContainerStyle={styles.modalScroll} persistentScrollbar={true}>
                                {consultas.map((consulta) => (
                                    <View key={consulta.id} style={styles.consultaMiniCard}>
                                        <View style={styles.consultaMiniHeader}>
                                            <Text style={styles.consultaMiniDate}>
                                                📅 {new Date(consulta.fecha).toLocaleDateString()}
                                            </Text>
                                            <Text style={styles.consultaMiniVet}>
                                                🩺 {consulta.veterinario}
                                            </Text>
                                        </View>

                                        <Text style={styles.consultaMiniLabel}>Motivo:</Text>
                                        <Text style={styles.consultaMiniValue}>{consulta.motivo}</Text>

                                        <Text style={styles.consultaMiniLabel}>Síntomas:</Text>
                                        <Text style={styles.consultaMiniValue}>{consulta.sintomas || 'Ninguno'}</Text>

                                        <Text style={styles.consultaMiniLabel}>Observaciones / Tratamiento:</Text>
                                        <Text style={styles.consultaMiniValue}>{consulta.observaciones || 'Ninguna'}</Text>

                                        <View style={styles.consultaMiniStats}>
                                            {consulta.peso_registrado && (
                                                <Text style={styles.consultaMiniStatText}>⚖️ {consulta.peso_registrado} kg</Text>
                                            )}
                                            {consulta.temperatura && (
                                                <Text style={styles.consultaMiniStatText}>🌡️ {consulta.temperatura} °C</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => setConsultasModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Cerrar Historial</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal para Agregar Paciente (Solo Admin) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={addModalVisible}
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>➕ Nuevo Paciente</Text>
                        <ScrollView contentContainerStyle={styles.modalScroll} persistentScrollbar={true}>
                            
                            <Text style={styles.label}>Propietario (Dueño) *</Text>
                            
                            {/* Selector de Modo de Propietario (Existente vs Nuevo) */}
                            <View style={styles.tabContainer}>
                                <TouchableOpacity 
                                    style={[styles.tabButton, propietarioModo === 'existente' && styles.tabButtonActive]}
                                    onPress={() => setPropietarioModo('existente')}
                                >
                                    <Text style={[styles.tabButtonText, propietarioModo === 'existente' && styles.tabButtonTextActive]}>
                                        Seleccionar Existente
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.tabButton, propietarioModo === 'nuevo' && styles.tabButtonActive]}
                                    onPress={() => setPropietarioModo('nuevo')}
                                >
                                    <Text style={[styles.tabButtonText, propietarioModo === 'nuevo' && styles.tabButtonTextActive]}>
                                        Crear Nuevo Dueño
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {propietarioModo === 'existente' ? (
                                <>
                                    {propietarios.length === 0 ? (
                                        <Text style={styles.noDataText}>Cargando dueños...</Text>
                                    ) : (
                                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                            {propietarios.map((p) => (
                                                <TouchableOpacity
                                                    key={p.id}
                                                    style={[
                                                        styles.selectorOption,
                                                        selectedPropietario === p.id.toString() && styles.selectorOptionActive
                                                    ]}
                                                    onPress={() => setSelectedPropietario(p.id.toString())}
                                                >
                                                    <Text style={[
                                                        styles.selectorOptionText,
                                                        selectedPropietario === p.id.toString() && styles.selectorOptionTextActive
                                                    ]}>
                                                        {p.nombre} {p.apellido}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                    {formErrors.propietario && <Text style={styles.formErrorText}>{formErrors.propietario}</Text>}

                                    {/* Mostrar detalles del dueño seleccionado para confirmación de datos */}
                                    {selectedPropietario ? (() => {
                                        const prop = propietarios.find(p => p.id.toString() === selectedPropietario);
                                        if (prop) {
                                            return (
                                                <View style={styles.selectedOwnerCard}>
                                                    <Text style={styles.selectedOwnerCardTitle}>Datos del Propietario Seleccionado:</Text>
                                                    <Text style={styles.selectedOwnerCardText}>👤 Propietario: {prop.nombre} {prop.apellido}</Text>
                                                    <Text style={styles.selectedOwnerCardText}>🆔 Cédula: {prop.cedula || 'No registrada'}</Text>
                                                    <Text style={styles.selectedOwnerCardText}>📞 Teléfono: {prop.telefono || 'No registrado'}</Text>
                                                    <Text style={styles.selectedOwnerCardText}>✉️ Email: {prop.email || 'No registrado'}</Text>
                                                </View>
                                            );
                                        }
                                        return null;
                                    })() : null}
                                </>
                            ) : (
                                <View style={styles.newOwnerForm}>
                                    <Text style={styles.subLabel}>Seleccionar Usuario Registrado *</Text>
                                    {registeredUsers.length === 0 ? (
                                        <Text style={styles.noDataText}>No hay cuentas de usuario de clientes disponibles que aún no sean propietarios.</Text>
                                    ) : (
                                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                            {registeredUsers.map((u) => (
                                                <TouchableOpacity
                                                    key={u.id}
                                                    style={[
                                                        styles.selectorOption,
                                                        selectedUserId === u.id.toString() && styles.selectorOptionActive
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedUserId(u.id.toString());
                                                        autoFillFromUser(u);
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.selectorOptionText,
                                                        selectedUserId === u.id.toString() && styles.selectorOptionTextActive
                                                    ]}>
                                                        👤 {u.nombre}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                    {formErrors.selectedUserId && <Text style={styles.formErrorText}>{formErrors.selectedUserId}</Text>}

                                    <View style={styles.selectedOwnerCard}>
                                        <Text style={styles.selectedOwnerCardTitle}>Datos de Cuenta a Vincular:</Text>
                                        <Text style={styles.selectedOwnerCardText}>👤 Nombre completo: {propNuevoNombre} {propNuevoApellido}</Text>
                                        <Text style={styles.selectedOwnerCardText}>📞 Teléfono: {propNuevoTelefono || 'No registrado'}</Text>
                                        <Text style={styles.selectedOwnerCardText}>✉️ Email: {propNuevoEmail}</Text>
                                    </View>

                                    <Text style={styles.subLabel}>Número de Cédula *</Text>
                                    <TextInput 
                                        style={[styles.input, formErrors.propNuevoCedula && styles.inputErr]}
                                        placeholder="Ej. 1-1234-5678"
                                        value={propNuevoCedula}
                                        onChangeText={setPropNuevoCedula}
                                    />
                                    {formErrors.propNuevoCedula && <Text style={styles.formErrorText}>{formErrors.propNuevoCedula}</Text>}
                                </View>
                            )}

                            <Text style={styles.label}>Nombre de Mascota *</Text>
                            <TextInput 
                                style={[styles.input, formErrors.nombre && styles.inputErr]}
                                placeholder="Ej. Coco"
                                value={nombre}
                                onChangeText={setNombre}
                            />
                            {formErrors.nombre && <Text style={styles.formErrorText}>{formErrors.nombre}</Text>}

                            <Text style={styles.label}>Especie *</Text>
                            <TextInput 
                                style={[styles.input, formErrors.especie && styles.inputErr]}
                                placeholder="Ej. Iguana verde o Loro gris"
                                value={especie}
                                onChangeText={setEspecie}
                            />
                            {formErrors.especie && <Text style={styles.formErrorText}>{formErrors.especie}</Text>}

                            <Text style={styles.label}>Grupo / Categoría *</Text>
                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                {['Reptil', 'Ave', 'Anfibio', 'Mamifero_Exotico', 'Aracnido', 'Otro'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.selectorOption,
                                            tipoAnimal === g && styles.selectorOptionActive
                                        ]}
                                        onPress={() => setTipoAnimal(g)}
                                    >
                                        <Text style={[
                                            styles.selectorOptionText,
                                            tipoAnimal === g && styles.selectorOptionTextActive
                                        ]}>
                                            {g.replace('_', ' ')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>Sexo</Text>
                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                {['Macho', 'Hembra', 'Indeterminado'].map((s) => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[
                                            styles.selectorOption,
                                            sexo === s && styles.selectorOptionActive
                                        ]}
                                        onPress={() => setSexo(s)}
                                    >
                                        <Text style={[
                                            styles.selectorOptionText,
                                            sexo === s && styles.selectorOptionTextActive
                                        ]}>
                                            {s}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>Peso (kg)</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Ej. 1.25"
                                value={peso}
                                onChangeText={setPeso}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Hábitat</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Ej. Terrario húmedo"
                                value={habitat}
                                onChangeText={setHabitat}
                            />

                            <Text style={styles.label}>Dieta (Puedes seleccionar varias)</Text>
                             <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={styles.horizontalScrollContent}>
                                 {['Carnivoro', 'Herbivoro', 'Insectivoro', 'Omnivoro', 'Otro'].map((d) => {
                                     const isSelected = dieta.includes(d);
                                     return (
                                         <TouchableOpacity
                                             key={d}
                                             style={[
                                                 styles.selectorOption,
                                                 isSelected && styles.selectorOptionActive
                                             ]}
                                             onPress={() => {
                                                 if (isSelected) {
                                                     setDieta(dieta.filter(item => item !== d));
                                                 } else {
                                                     setDieta([...dieta, d]);
                                                 }
                                             }}
                                         >
                                             <Text style={[
                                                 styles.selectorOptionText,
                                                 isSelected && styles.selectorOptionTextActive
                                             ]}>
                                                 {d === 'Carnivoro' ? '🥩 Carnívoro' : 
                                                  d === 'Herbivoro' ? '🥬 Herbívoro' : 
                                                  d === 'Insectivoro' ? '🐛 Insectívoro' : 
                                                  d === 'Omnivoro' ? '🥗 Omnívoro' : '❓ Otro'}
                                             </Text>
                                         </TouchableOpacity>
                                     );
                                 })}
                             </ScrollView>

                             {dieta.includes('Otro') && (
                                 <>
                                     <Text style={styles.subLabel}>Especificar otra dieta *</Text>
                                     <TextInput
                                         style={[styles.input, formErrors.dietaOtro && styles.inputErr]}
                                         placeholder="Ej. Semillas, néctar, frutas específicas..."
                                         value={dietaOtro}
                                         onChangeText={(text) => {
                                             setDietaOtro(text);
                                             if (formErrors.dietaOtro) {
                                                 setFormErrors(prev => ({ ...prev, dietaOtro: null }));
                                             }
                                         }}
                                     />
                                     {formErrors.dietaOtro && <Text style={styles.formErrorText}>{formErrors.dietaOtro}</Text>}
                                 </>
                             )}

                            <Text style={styles.label}>Código Microchip</Text>
                            <TextInput 
                                style={[styles.input, formErrors.microchip && styles.inputErr]}
                                placeholder="Ej. 900.111.000.123.456 o N-A (Opcional)"
                                value={microchip}
                                onChangeText={setMicrochip}
                            />
                            {formErrors.microchip && <Text style={styles.formErrorText}>{formErrors.microchip}</Text>}
                        </ScrollView>

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelModalBtn]} 
                                onPress={() => setAddModalVisible(false)}
                            >
                                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.saveModalBtn]} 
                                onPress={handleAddPaciente}
                                disabled={addLoading}
                            >
                                {addLoading ? (
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
        marginLeft: 15,
    },
    addButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    addButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
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
        fontSize: 18,
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
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
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
    adminSection: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 15,
    },
    ownerCardSection: {
        marginTop: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sectionSubTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 8,
    },
    deleteButton: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 14,
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
    inputErr: {
        borderColor: '#ef4444',
    },
    formErrorText: {
        color: '#ef4444',
        fontSize: 11,
        marginTop: 2,
    },
    selectorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
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
        color: '#94a3b8',
        fontStyle: 'italic',
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
    consultasButton: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    consultasButtonText: {
        color: '#16a34a',
        fontSize: 16,
        fontWeight: 'bold',
    },
    consultaMiniCard: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    consultaMiniHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 6,
        marginBottom: 6,
    },
    consultaMiniDate: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    consultaMiniVet: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    consultaMiniLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
        marginTop: 6,
    },
    consultaMiniValue: {
        fontSize: 13,
        color: '#334155',
    },
    consultaMiniStats: {
        flexDirection: 'row',
        marginTop: 8,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    consultaMiniStatText: {
        fontSize: 11,
        color: '#64748b',
        marginRight: 15,
        fontWeight: '600',
    },
    selectedOwnerCard: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 8,
        padding: 10,
        marginVertical: 10,
    },
    selectedOwnerCardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 4,
    },
    selectedOwnerCardText: {
        fontSize: 12,
        color: '#1e3a8a',
        marginTop: 2,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
        padding: 4,
        marginVertical: 10,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    tabButtonActive: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    tabButtonTextActive: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    subLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
        marginTop: 8,
        marginBottom: 4,
    },
    newOwnerForm: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        padding: 12,
        marginVertical: 10,
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
    modalExportButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        marginBottom: 10,
    },
});
