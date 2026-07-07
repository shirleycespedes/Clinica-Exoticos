import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register } from './authService';

export default function RegisterScreen({ navigation }) {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [telefono, setTelefono] = useState('');
    const [rol, setRol] = useState('cliente');
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);

    // Estados para errores de validación de campos
    const [nombreError, setNombreError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [telefonoError, setTelefonoError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    setCurrentUser(JSON.parse(userData));
                }
            } catch (error) {
                console.error('Error al cargar datos del usuario activo:', error);
            }
        };
        loadCurrentUser();
    }, []);

    const limpiarErrores = () => {
        setNombreError('');
        setEmailError('');
        setTelefonoError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setGeneralError('');
        setSuccessMessage('');
    };

    const handleRegister = async () => {
        limpiarErrores();
        
        let isValid = true;

        // Validaciones del cliente
        if (!nombre.trim()) {
            setNombreError('El nombre completo es requerido.');
            isValid = false;
        } else if (nombre.trim().length < 2) {
            setNombreError('El nombre debe tener al menos 2 caracteres.');
            isValid = false;
        } else if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(nombre)) {
            setNombreError('El nombre solo puede contener letras y espacios.');
            isValid = false;
        }

        if (!email.trim()) {
            setEmailError('El email es requerido.');
            isValid = false;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                setEmailError('Por favor ingresa un email válido.');
                isValid = false;
            }
        }

        if (telefono.trim()) {
            const telRegex = /^[\+]?[0-9\-\(\)\s]{7,20}$/;
            if (!telRegex.test(telefono.trim())) {
                setTelefonoError('Formato de teléfono inválido (7-20 números).');
                isValid = false;
            }
        }

        if (!password) {
            setPasswordError('La contraseña es requerida.');
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError('La contraseña debe tener al menos 6 caracteres.');
            isValid = false;
        } else {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-\/#])/;
            if (!passwordRegex.test(password)) {
                setPasswordError(
                    'Debe contener una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&._-/#).'
                );
                isValid = false;
            }
        }

        if (!confirmPassword) {
            setConfirmPasswordError('Por favor confirma tu contraseña.');
            isValid = false;
        } else if (password !== confirmPassword) {
            setConfirmPasswordError('Las contraseñas no coinciden.');
            isValid = false;
        }

        if (!isValid) return;

        setLoading(true);
        try {
            await register(nombre, email, password, telefono || undefined, rol);
            
            setSuccessMessage(
                rol === 'admin'
                    ? '¡Administrador registrado correctamente!'
                    : '¡Registro completado con éxito!'
            );
            
            // Espera corta para que el usuario pueda ver el mensaje de éxito antes de redirigir
            setTimeout(() => {
                navigation.replace('Dashboard');
            }, 1500);

        } catch (error) {
            console.error('Error en el registro:', error);
            
            // Mapear errores del backend a los campos correspondientes
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach(err => {
                    if (err.path === 'nombre') setNombreError(err.msg);
                    else if (err.path === 'email') setEmailError(err.msg);
                    else if (err.path === 'telefono') setTelefonoError(err.msg);
                    else if (err.path === 'password') setPasswordError(err.msg);
                });
            } else {
                setGeneralError(
                    error.response?.data?.error || 
                    error.response?.data?.message || 
                    error.message ||
                    'Error al registrar la cuenta'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    <Text style={styles.title}>🦎 Registro</Text>
                    <Text style={styles.subtitle}>
                        {currentUser && currentUser.rol === 'admin' 
                            ? 'Registrar nuevo usuario desde Admin' 
                            : 'Crea tu cuenta en VetExóticos'}
                    </Text>

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

                        <Text style={styles.label}>Nombre Completo *</Text>
                        <TextInput
                            style={[styles.input, nombreError ? styles.inputError : null]}
                            placeholder="Ej. Juan Pérez"
                            value={nombre}
                            onChangeText={text => { setNombre(text); setNombreError(''); }}
                            autoCapitalize="words"
                        />
                        {nombreError ? <Text style={styles.errorText}>{nombreError}</Text> : null}

                        <Text style={styles.label}>Email *</Text>
                        <TextInput
                            style={[styles.input, emailError ? styles.inputError : null]}
                            placeholder="Ej. juan@email.com"
                            value={email}
                            onChangeText={text => { setEmail(text); setEmailError(''); }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        <Text style={styles.label}>Teléfono</Text>
                        <TextInput
                            style={[styles.input, telefonoError ? styles.inputError : null]}
                            placeholder="Ej. +506 8888-8888"
                            value={telefono}
                            onChangeText={text => { setTelefono(text); setTelefonoError(''); }}
                            keyboardType="phone-pad"
                        />
                        {telefonoError ? <Text style={styles.errorText}>{telefonoError}</Text> : null}

                        {/* Cédula ya no se solicita para registro inicial de usuarios */}

                        {/* Mostrar selector de rol únicamente si el usuario activo es administrador */}
                        {currentUser && currentUser.rol === 'admin' && (
                            <View style={styles.roleContainer}>
                                <Text style={styles.label}>Rol de Usuario *</Text>
                                <View style={styles.roleOptions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.roleOptionButton,
                                            rol === 'cliente' && styles.roleOptionButtonActive,
                                        ]}
                                        onPress={() => setRol('cliente')}
                                    >
                                        <Text
                                            style={[
                                                styles.roleOptionText,
                                                rol === 'cliente' && styles.roleOptionTextActive,
                                            ]}
                                        >
                                            Cliente
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.roleOptionButton,
                                            rol === 'admin' && styles.roleOptionButtonActive,
                                        ]}
                                        onPress={() => setRol('admin')}
                                    >
                                        <Text
                                            style={[
                                                styles.roleOptionText,
                                                rol === 'admin' && styles.roleOptionTextActive,
                                            ]}
                                        >
                                            Administrador
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <Text style={styles.label}>Contraseña *</Text>
                        <Text style={styles.helperText}>
                            Mínimo 6 caracteres, con mayúscula, minúscula, número y carácter especial (@$!%*?&._-/#).
                        </Text>
                        <TextInput
                            style={[styles.input, passwordError ? styles.inputError : null]}
                            placeholder="Crea tu contraseña"
                            value={password}
                            onChangeText={text => { setPassword(text); setPasswordError(''); }}
                            secureTextEntry
                        />
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                        <Text style={styles.label}>Confirmar Contraseña *</Text>
                        <TextInput
                            style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                            placeholder="Confirma tu contraseña"
                            value={confirmPassword}
                            onChangeText={text => { setConfirmPassword(text); setConfirmPasswordError(''); }}
                            secureTextEntry
                        />
                        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {currentUser && currentUser.rol === 'admin' 
                                        ? 'Registrar Usuario' 
                                        : 'Registrarse'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>
                                {currentUser && currentUser.rol === 'admin'
                                    ? '¿Deseas volver al Panel? '
                                    : '¿Ya tienes una cuenta? '}
                            </Text>
                            <TouchableOpacity
                                onPress={() =>
                                    currentUser && currentUser.rol === 'admin'
                                        ? navigation.replace('Dashboard')
                                        : navigation.navigate('Login')
                                }
                            >
                                <Text style={styles.loginLink}>
                                    {currentUser && currentUser.rol === 'admin' 
                                        ? 'Volver' 
                                        : 'Inicia Sesión'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#2563eb',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 30,
    },
    form: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    helperText: {
        fontSize: 11,
        color: '#666',
        marginBottom: 6,
        fontStyle: 'italic',
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
    roleContainer: {
        marginBottom: 15,
    },
    roleOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    roleOptionButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginHorizontal: 4,
        backgroundColor: '#fafafa',
    },
    roleOptionButtonActive: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    roleOptionText: {
        color: '#666',
        fontWeight: '600',
    },
    roleOptionTextActive: {
        color: '#2563eb',
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    loginLink: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
