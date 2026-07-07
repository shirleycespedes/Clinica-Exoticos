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

export default function PerfilScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    
    // Propietario specific fields (only for clients)
    const [apellido, setApellido] = useState('');
    const [cedula, setCedula] = useState('');

    // Password change fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Error and Success states
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                // Obtener perfil detallado del backend
                const response = await api.get('/auth/profile');
                if (response.data.success) {
                    const profileData = response.data.data;
                    setUser(profileData);
                    
                    setNombre(profileData.nombre || '');
                    setEmail(profileData.email || '');
                    setTelefono(profileData.telefono || '');
                    setApellido(profileData.apellido || '');
                    setCedula(profileData.cedula || '');
                }
            } catch (err) {
                console.error('Error al cargar perfil:', err);
                setGeneralError('No se pudo cargar la información de perfil.');
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleSave = async () => {
        setErrors({});
        setGeneralError('');
        setSuccessMessage('');

        let formErrors = {};
        if (!nombre.trim()) formErrors.nombre = 'El nombre es obligatorio.';
        
        if (!email.trim()) {
            formErrors.email = 'El email es obligatorio.';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                formErrors.email = 'Ingresa un email válido.';
            }
        }

        if (user?.rol === 'cliente') {
            if (!apellido.trim()) formErrors.apellido = 'El apellido es obligatorio.';
        }

        // Validar cambio de contraseña si el usuario escribió en alguno de los campos
        const isChangingPassword = currentPassword || newPassword || confirmPassword;
        if (isChangingPassword) {
            if (!currentPassword) {
                formErrors.currentPassword = 'La contraseña actual es obligatoria.';
            }
            if (!newPassword) {
                formErrors.newPassword = 'La nueva contraseña es obligatoria.';
            } else if (newPassword.length < 6) {
                formErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres.';
            } else {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-\/#])/;
                if (!passwordRegex.test(newPassword)) {
                    formErrors.newPassword = 'Debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&._-/#).';
                }
            }
            if (newPassword !== confirmPassword) {
                formErrors.confirmPassword = 'Las contraseñas nuevas no coinciden.';
            }
        }

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setSaving(true);
        try {
            const body = {
                nombre: nombre.trim(),
                email: email.trim(),
                telefono: telefono.trim(),
                apellido: user?.rol === 'cliente' ? apellido.trim() : undefined,
                cedula: user?.rol === 'cliente' ? (cedula.trim() || undefined) : undefined,
            };

            // 1. Guardar cambios básicos de perfil
            const response = await api.put('/auth/profile', body);
            let profileUpdated = response.data.success;
            let passwordUpdated = false;

            if (profileUpdated) {
                // Actualizar los datos locales del usuario en AsyncStorage
                const updatedUserObj = response.data.data;
                await AsyncStorage.setItem('user', JSON.stringify(updatedUserObj));
                setUser(updatedUserObj);
            }

            // 2. Guardar cambio de contraseña si procede
            if (isChangingPassword) {
                await api.put('/auth/change-password', {
                    currentPassword,
                    newPassword
                });
                passwordUpdated = true;
            }

            // 3. Mostrar mensajes y limpiar
            if (profileUpdated && passwordUpdated) {
                setSuccessMessage('¡Perfil y contraseña actualizados con éxito!');
            } else if (profileUpdated) {
                setSuccessMessage('¡Perfil actualizado con éxito!');
            } else if (passwordUpdated) {
                setSuccessMessage('¡Contraseña actualizada con éxito!');
            }

            // Resetear campos de contraseña
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsEditing(false);
        } catch (err) {
            console.error('Error al guardar cambios de perfil/contraseña:', err);
            setGeneralError(err.response?.data?.message || 'Error al actualizar el perfil o contraseña.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setNombre(user.nombre || '');
            setEmail(user.email || '');
            setTelefono(user.telefono || '');
            setApellido(user.apellido || '');
            setCedula(user.cedula || '');
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        setGeneralError('');
        setSuccessMessage('');
        setIsEditing(false);
    };

    const handleDeleteAccount = () => {
        const performDelete = async () => {
            setSaving(true);
            try {
                const response = await api.delete('/auth/profile');
                if (response.data.success) {
                    showAlert('Cuenta Eliminada', 'Tu cuenta ha sido eliminada permanentemente. Esperamos volver a verte pronto.');
                    await AsyncStorage.clear();
                    navigation.replace('Login');
                }
            } catch (err) {
                showAlert('Error', err.response?.data?.message || 'No se pudo eliminar tu cuenta.');
            } finally {
                setSaving(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('⚠️ ¿Estás completamente seguro de que deseas eliminar permanentemente tu cuenta? Esta acción borrará tus datos y no se puede deshacer.')) {
                performDelete();
            }
        } else {
            Alert.alert(
                '⚠️ Confirmación de Eliminación',
                '¿Estás completamente seguro de que deseas eliminar permanentemente tu cuenta? Esta acción borrará todos tus datos y no se puede deshacer.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar Cuenta', style: 'destructive', onPress: performDelete }
                ]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Volver al Panel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Perfil</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Cargando información personal...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        <View style={styles.avatarCard}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitial}>
                                    {nombre ? nombre.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                            <Text style={styles.profileName}>{nombre || 'Usuario'}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>
                                    {user ? user.rol?.toUpperCase() : 'CLIENTE'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.form}>
                            <Text style={styles.sectionTitle}>Datos Personales</Text>
                            
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

                            {!isEditing ? (
                                <View style={styles.infoContainer}>
                                    {/* Nombre */}
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Nombre Completo</Text>
                                        <Text style={styles.infoValue}>{nombre || '-'}</Text>
                                    </View>

                                    {/* Apellido (Sólo Clientes) */}
                                    {user && user.rol === 'cliente' && (
                                        <>
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoLabel}>Primer Apellido</Text>
                                                <Text style={styles.infoValue}>{apellido || '-'}</Text>
                                            </View>
                                        </>
                                    )}

                                    {/* Email */}
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Email</Text>
                                        <Text style={styles.infoValue}>{email || '-'}</Text>
                                    </View>

                                    {/* Teléfono */}
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Número de Teléfono</Text>
                                        <Text style={styles.infoValue}>{telefono || '-'}</Text>
                                    </View>

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity 
                                            style={styles.editButton} 
                                            onPress={() => setIsEditing(true)}
                                        >
                                            <Text style={styles.editButtonText}>✏️ Editar Perfil</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={styles.deleteAccountButton} 
                                            onPress={handleDeleteAccount}
                                            disabled={saving}
                                        >
                                            <Text style={styles.deleteAccountButtonText}>🗑️ Eliminar Cuenta</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View>
                                    {/* Nombre */}
                                    <Text style={styles.label}>Nombre Completo *</Text>
                                    <TextInput 
                                        style={[styles.input, errors.nombre && styles.inputErr]}
                                        placeholder="Ingresa tu nombre..."
                                        value={nombre}
                                        onChangeText={setNombre}
                                    />
                                    {errors.nombre && <Text style={styles.formErrorText}>{errors.nombre}</Text>}

                                    {/* Apellido (Sólo Clientes) */}
                                    {user && user.rol === 'cliente' && (
                                        <>
                                            <Text style={styles.label}>Primer Apellido *</Text>
                                            <TextInput 
                                                style={[styles.input, errors.apellido && styles.inputErr]}
                                                placeholder="Ingresa tu apellido..."
                                                value={apellido}
                                                onChangeText={setApellido}
                                            />
                                            {errors.apellido && <Text style={styles.formErrorText}>{errors.apellido}</Text>}
                                        </>
                                    )}

                                    {/* Email */}
                                    <Text style={styles.label}>Email *</Text>
                                    <TextInput 
                                        style={[styles.input, errors.email && styles.inputErr]}
                                        placeholder="email@ejemplo.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                    {errors.email && <Text style={styles.formErrorText}>{errors.email}</Text>}

                                    {/* Teléfono */}
                                    <Text style={styles.label}>Número de Teléfono</Text>
                                    <TextInput 
                                        style={styles.input}
                                        placeholder="Ej: 8888-8888"
                                        value={telefono}
                                        onChangeText={setTelefono}
                                        keyboardType="phone-pad"
                                    />

                                    {/* Cambiar Contraseña Section */}
                                    <Text style={styles.passwordSectionTitle}>Cambiar Contraseña (Opcional)</Text>

                                    {/* Contraseña Actual */}
                                    <Text style={styles.label}>Contraseña Actual</Text>
                                    <TextInput 
                                        style={[styles.input, errors.currentPassword && styles.inputErr]}
                                        placeholder="Ingresa tu contraseña actual..."
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        secureTextEntry
                                    />
                                    {errors.currentPassword && <Text style={styles.formErrorText}>{errors.currentPassword}</Text>}

                                    {/* Nueva Contraseña */}
                                    <Text style={styles.label}>Nueva Contraseña</Text>
                                    <TextInput 
                                        style={[styles.input, errors.newPassword && styles.inputErr]}
                                        placeholder="Nueva contraseña (mín. 6 caracteres)..."
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                    />
                                    {errors.newPassword && <Text style={styles.formErrorText}>{errors.newPassword}</Text>}

                                    {/* Confirmar Nueva Contraseña */}
                                    <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                                    <TextInput 
                                        style={[styles.input, errors.confirmPassword && styles.inputErr]}
                                        placeholder="Confirma la nueva contraseña..."
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                    {errors.confirmPassword && <Text style={styles.formErrorText}>{errors.confirmPassword}</Text>}

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity 
                                            style={styles.saveButton} 
                                            onPress={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.saveButtonText}>Guardar</Text>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={styles.cancelButton} 
                                            onPress={handleCancel}
                                            disabled={saving}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            )}
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
        fontSize: 16,
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
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        padding: 20,
    },
    avatarCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarInitial: {
        color: '#ffffff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    roleBadge: {
        backgroundColor: '#eff6ff',
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    roleText: {
        color: '#2563eb',
        fontSize: 11,
        fontWeight: 'bold',
    },
    form: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
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
    errorBanner: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    errorBannerText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    successBanner: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#86efac',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    successBannerText: {
        color: '#16a34a',
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    deleteAccountButton: {
        flex: 1,
        backgroundColor: '#fff1f2',
        borderWidth: 1,
        borderColor: '#fecdd3',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteAccountButtonText: {
        color: '#be123c',
        fontSize: 15,
        fontWeight: 'bold',
    },
    infoContainer: {
        marginTop: 5,
    },
    infoRow: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 3,
    },
    infoValue: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 25,
        gap: 12,
    },
    editButton: {
        flex: 1,
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#475569',
        fontSize: 15,
        fontWeight: 'bold',
    },
    passwordSectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#475569',
        marginTop: 25,
        marginBottom: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 15,
    },
});
