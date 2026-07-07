import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

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

export default function AgendarCitaScreen({ route, navigation }) {
    const [user, setUser] = useState(null);
    const [mascotas, setMascotas] = useState([]);
    const [selectedMascota, setSelectedMascota] = useState('');
    
    // Form States
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [motivo, setMotivo] = useState('');
    const [veterinario, setVeterinario] = useState('');

    // Admin Users List (for Veterinarians selection)
    const [admins, setAdmins] = useState([]);
    const [selectedAdminId, setSelectedAdminId] = useState('');

    // Slots booking state
    const [allAppointments, setAllAppointments] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Error States
    const [mascotaError, setMascotaError] = useState('');
    const [fechaError, setFechaError] = useState('');
    const [horaError, setHoraError] = useState('');
    const [motivoError, setMotivoError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [loadingMascotas, setLoadingMascotas] = useState(true);

    const availableHours = [
        '06:00', '07:00', '08:00', '09:00', '10:00', 
        '11:00', '12:00', '13:00', '14:00', '15:00'
    ];

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Cargar datos del usuario
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);

                    // 2. Cargar mascotas
                    const endpoint = parsedUser.rol === 'admin' ? '/pacientes?limit=1000' : '/pacientes/mis-pacientes';
                    const response = await api.get(endpoint);
                    if (response.data.success) {
                        setMascotas(response.data.data);
                        if (response.data.data.length > 0) {
                            setSelectedMascota(response.data.data[0].id.toString());
                        }
                    }

                    // 3. Cargar administradores como veterinarios elegibles
                    const adminsRes = await api.get('/auth/admins');
                    if (adminsRes.data.success) {
                        setAdmins(adminsRes.data.data);
                        if (adminsRes.data.data.length > 0) {
                            setSelectedAdminId(adminsRes.data.data[0].nombre);
                        }
                    }
                }
            } catch (err) {
                console.error('Error al cargar datos iniciales para agendar cita:', err);
                setGeneralError('No se pudieron cargar todos los datos de configuración.');
            } finally {
                setLoadingMascotas(false);
            }
        };

        const paramFecha = route?.params?.fecha;
        const paramHora = route?.params?.hora;

        if (paramFecha) {
            setFecha(paramFecha);
        } else {
            // Autocompletar la fecha de hoy
            const hoy = new Date();
            const yyyy = hoy.getFullYear();
            const mm = String(hoy.getMonth() + 1).padStart(2, '0');
            const dd = String(hoy.getDate()).padStart(2, '0');
            const defaultDate = `${yyyy}-${mm}-${dd}`;
            setFecha(defaultDate);
        }

        if (paramHora) {
            setHora(paramHora);
        }

        loadInitialData();
        fetchAppointmentsForSlots();
    }, []);

    // Cada vez que cambia la fecha, cargamos las citas para validar horarios
    useEffect(() => {
        if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            fetchAppointmentsForSlots();
        }
    }, [fecha]);

    const fetchAppointmentsForSlots = async () => {
        setLoadingSlots(true);
        try {
            const response = await api.get('/citas/ocupadas');
            if (response.data.success) {
                setAllAppointments(response.data.data);
            }
        } catch (err) {
            console.error('Error al cargar slots de citas:', err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const getOccupiedSlots = () => {
        if (!fecha) return [];
        return allAppointments
            .filter(c => {
                const cDate = new Date(c.fecha_cita).toISOString().split('T')[0];
                return cDate === fecha.trim() && c.estado !== 'cancelada';
            })
            .map(c => c.hora_cita.substring(0, 5));
    };

    const limpiarErrores = () => {
        setMascotaError('');
        setFechaError('');
        setHoraError('');
        setMotivoError('');
        setGeneralError('');
        setSuccessMessage('');
    };

    const handleAgendar = async () => {
        limpiarErrores();
        let isValid = true;

        if (!selectedMascota) {
            setMascotaError('Debes seleccionar una mascota.');
            isValid = false;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fecha.trim()) {
            setFechaError('La fecha es requerida.');
            isValid = false;
        } else if (!dateRegex.test(fecha.trim())) {
            setFechaError('Formato inválido (debe ser AAAA-MM-DD).');
            isValid = false;
        } else {
            const dateParts = fecha.trim().split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const day = parseInt(dateParts[2]);
            const selectedDate = new Date(year, month, day);
            const dayOfWeek = selectedDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                setFechaError('Las citas solo se pueden agendar de lunes a viernes.');
                isValid = false;
            }
        }

        if (!hora) {
            setHoraError('Debes seleccionar un horario.');
            isValid = false;
        }

        if (!motivo.trim()) {
            setMotivoError('El motivo es requerido.');
            isValid = false;
        }

        if (!isValid) return;

        setLoading(true);
        try {
            const mascotaObj = mascotas.find(m => m.id.toString() === selectedMascota);
            const propietarioId = user?.propietario_id || mascotaObj?.propietario_id;

            if (!propietarioId) {
                throw new Error('No se detectó un perfil de propietario válido.');
            }

            const vetAsignado = user?.rol === 'admin' ? selectedAdminId : 'Por definir';

            const body = {
                paciente_id: parseInt(selectedMascota),
                propietario_id: propietarioId,
                fecha_cita: fecha.trim(),
                hora_cita: hora.trim(), // Enviar con formato HH:MM (ej: 06:00)
                motivo: motivo.trim(),
                estado: 'pendiente',
                veterinario_asignado: vetAsignado
            };

            const response = await api.post('/citas', body);

            if (response.data.success) {
                setSuccessMessage('¡Cita agendada correctamente!');
                setTimeout(() => {
                    navigation.replace('Citas');
                }, 1500);
            }
        } catch (error) {
            console.error('Error al agendar cita:', error);
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach(err => {
                    if (err.path === 'paciente_id') setMascotaError(err.msg);
                    else if (err.path === 'fecha_cita') setFechaError(err.msg);
                    else if (err.path === 'hora_cita') setHoraError(err.msg);
                    else if (err.path === 'motivo') setMotivoError(err.msg);
                });
            } else {
                setGeneralError(
                    error.response?.data?.message || 
                    error.message || 
                    'Error al agendar la cita. Inténtalo de nuevo.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const occupiedSlots = getOccupiedSlots();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Volver</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agendar Cita</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Text style={styles.subtitle}>Selecciona el día, horario disponible y motivo de la cita</Text>

                    <View style={styles.form}>
                        {generalError ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorBannerText}>⚠️ {generalError}</Text>
                            </View>
                        ) : null}

                        {successMessage ? (
                            <View style={styles.successBanner}>
                                <Text style={styles.successBannerText}>✅ {successMessage}</Text>
                            </View>
                        ) : null}

                        {/* Selección de Mascota */}
                        <Text style={styles.label}>Seleccionar Mascota *</Text>
                        {loadingMascotas ? (
                            <ActivityIndicator size="small" color="#2563eb" style={styles.spinner} />
                        ) : mascotas.length === 0 ? (
                            <Text style={styles.noMascotasText}>No tienes mascotas registradas para agendar.</Text>
                        ) : (
                            <View style={styles.mascotaSelectorContainer}>
                                {mascotas.map((mascota) => (
                                    <TouchableOpacity
                                        key={mascota.id}
                                        style={[
                                            styles.mascotaOption,
                                            selectedMascota === mascota.id.toString() && styles.mascotaOptionActive
                                        ]}
                                        onPress={() => { setSelectedMascota(mascota.id.toString()); setMascotaError(''); }}
                                    >
                                        <Text style={styles.mascotaEmoji}>
                                            {getAnimalEmoji(mascota.tipo_animal, mascota.especie, mascota.nombre)}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.mascotaOptionText,
                                                selectedMascota === mascota.id.toString() && styles.mascotaOptionTextActive
                                            ]}
                                        >
                                            {mascota.nombre} ({mascota.especie}) {user?.rol === 'admin' ? `- Propietario ID: ${mascota.propietario_id}` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        {mascotaError ? <Text style={styles.errorText}>{mascotaError}</Text> : null}

                        {/* Fecha */}
                        <Text style={styles.label}>Fecha (AAAA-MM-DD) *</Text>
                        <TextInput
                            style={[styles.input, fechaError ? styles.inputError : null]}
                            placeholder="Ej. 2026-07-25"
                            value={fecha}
                            onChangeText={text => { setFecha(text); setFechaError(''); }}
                        />
                        {fechaError ? <Text style={styles.errorText}>{fechaError}</Text> : null}

                        {/* Selector de Horarios Disponibles */}
                        <Text style={styles.label}>Horarios Disponibles (6:00 a 15:00) *</Text>
                        {loadingSlots ? (
                            <ActivityIndicator size="small" color="#2563eb" style={styles.spinner} />
                        ) : (() => {
                            // Validar fin de semana primero
                            const dateParts = fecha.trim().split('-');
                            let isWeekend = false;
                            if (dateParts.length === 3) {
                                const year = parseInt(dateParts[0]);
                                const month = parseInt(dateParts[1]) - 1;
                                const day = parseInt(dateParts[2]);
                                const selectedDate = new Date(year, month, day);
                                const dayOfWeek = selectedDate.getDay();
                                if (dayOfWeek === 0 || dayOfWeek === 6) {
                                    isWeekend = true;
                                }
                            }

                            if (isWeekend) {
                                return (
                                    <Text style={styles.weekendWarningText}>
                                        ⚠️ Las citas solo se pueden agendar de lunes a viernes.
                                    </Text>
                                );
                            }

                            const freeSlots = availableHours.filter(h => !occupiedSlots.includes(h));
                            if (freeSlots.length === 0) {
                                return (
                                    <Text style={styles.noMascotasText}>No hay horarios disponibles para la fecha seleccionada.</Text>
                                );
                            }
                            return (
                                <View style={styles.slotsGrid}>
                                    {freeSlots.map((h) => (
                                        <TouchableOpacity
                                            key={h}
                                            style={[
                                                styles.slotButton,
                                                hora === h && styles.slotButtonActive
                                            ]}
                                            onPress={() => { setHora(h); setHoraError(''); }}
                                        >
                                            <Text style={[
                                                styles.slotText,
                                                hora === h && styles.slotTextActive
                                            ]}>
                                                {h}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            );
                        })()}
                        {horaError ? <Text style={styles.errorText}>{horaError}</Text> : null}

                        {/* Veterinarios Disponibles (Solo para Admin) */}
                        {user && user.rol === 'admin' && (
                            <>
                                <Text style={styles.label}>Asignar Veterinario (Admin Registrado) *</Text>
                                {admins.length === 0 ? (
                                    <Text style={styles.noMascotasText}>Cargando veterinarios...</Text>
                                ) : (
                                    <View style={styles.selectorRow}>
                                        {admins.map((admin) => (
                                            <TouchableOpacity
                                                key={admin.id}
                                                style={[
                                                    styles.selectorOption,
                                                    selectedAdminId === admin.nombre && styles.selectorOptionActive
                                                ]}
                                                onPress={() => setSelectedAdminId(admin.nombre)}
                                            >
                                                <Text style={[
                                                    styles.selectorOptionText,
                                                    selectedAdminId === admin.nombre && styles.selectorOptionTextActive
                                                ]}>
                                                    👨‍⚕️ {admin.nombre}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        {/* Motivo */}
                        <Text style={styles.label}>Motivo de la Cita *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, motivoError ? styles.inputError : null]}
                            placeholder="Describe el motivo de la consulta..."
                            value={motivo}
                            onChangeText={text => { setMotivo(text); setMotivoError(''); }}
                            multiline
                            numberOfLines={4}
                        />
                        {motivoError ? <Text style={styles.errorText}>{motivoError}</Text> : null}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleAgendar}
                            disabled={loading || mascotas.length === 0}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Confirmar Cita</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
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
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        padding: 20,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 20,
    },
    form: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
        marginTop: 10,
    },
    spinner: {
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    noMascotasText: {
        color: '#ef4444',
        fontSize: 14,
        marginBottom: 15,
        fontStyle: 'italic',
    },
    mascotaSelectorContainer: {
        marginBottom: 15,
    },
    mascotaOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        backgroundColor: '#fafafa',
    },
    mascotaOptionActive: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    mascotaEmoji: {
        fontSize: 22,
        marginRight: 10,
    },
    mascotaOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#475569',
        flex: 1,
    },
    mascotaOptionTextActive: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: -10,
        marginBottom: 12,
        fontWeight: '500',
    },
    errorBanner: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    errorBannerText: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: 14,
    },
    successBanner: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#86efac',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    successBannerText: {
        color: '#16a34a',
        fontWeight: '600',
        fontSize: 14,
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    slotButton: {
        width: '30%',
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        marginBottom: 10,
    },
    slotButtonOccupied: {
        backgroundColor: '#fee2e2',
        borderColor: '#fca5a5',
    },
    slotButtonActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    slotText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    slotTextOccupied: {
        color: '#ef4444',
        textDecorationLine: 'line-through',
    },
    slotTextActive: {
        color: '#ffffff',
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
    weekendWarningText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: 'bold',
        paddingVertical: 16,
        textAlign: 'center',
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fee2e2',
        borderRadius: 8,
        marginVertical: 10,
    },
});
