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
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register, verifyLoginCode, resendVerificationCode } from './authService';
import { displaySystemNotification } from './notificationService';

export default function RegisterScreen({ navigation }) {
    const [step, setStep] = useState(1);
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [telefono, setTelefono] = useState('');
    const [rol, setRol] = useState('cliente');
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);

    // Estados para verificación de código en Paso 2
    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

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

    // Temporizador de cuenta regresiva para reenviar código
    useEffect(() => {
        let timer = null;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [resendCooldown]);

    const limpiarErrores = () => {
        setNombreError('');
        setEmailError('');
        setTelefonoError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setCodeError('');
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
            const response = await register(nombre.trim(), email.trim(), password, telefono.trim() || undefined, rol);
            
            if (rol === 'admin' && currentUser?.rol === 'admin') {
                await displaySystemNotification(
                    '🛡️ Nuevo Administrador Registrado',
                    `Se ha otorgado acceso administrativo a ${nombre.trim()} (${email.trim()}).`,
                    { screen: 'Usuarios' }
                );
                setSuccessMessage('¡Administrador registrado correctamente!');
                setTimeout(() => {
                    navigation.replace('Usuarios');
                }, 1500);
                return;
            }

            if (response?.requireVerification) {
                setRegisteredEmail(email.trim());
                setCode('');
                setStep(2);
                setResendCooldown(30);
                if (Platform.OS === 'web') {
                    alert('Se ha enviado un código de verificación a tu correo electrónico para confirmar tu identidad.');
                } else {
                    Alert.alert(
                        'Código Enviado',
                        'Se ha enviado un código de verificación a tu correo electrónico para confirmar tu identidad.',
                        [{ text: 'OK' }]
                    );
                }
            } else {
                setSuccessMessage('¡Registro completado con éxito!');
                setTimeout(() => {
                    navigation.replace('Dashboard');
                }, 1500);
            }
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

    const handleVerifyCode = async () => {
        setCodeError('');
        setGeneralError('');

        if (!code.trim()) {
            setCodeError('El código de verificación es requerido.');
            return;
        } else if (code.trim().length !== 6 || !/^\d{6}$/.test(code.trim())) {
            setCodeError('El código debe contener exactamente 6 dígitos numéricos.');
            return;
        }

        setLoading(true);
        try {
            await verifyLoginCode(registeredEmail || email.trim(), code.trim());
            setSuccessMessage('¡Cuenta verificada y activada con éxito!');
            setTimeout(() => {
                navigation.replace('Dashboard');
            }, 1000);
        } catch (error) {
            console.error('Error al verificar código de registro:', error);

            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                error.response.data.errors.forEach(err => {
                    const path = err.path || err.param;
                    if (path === 'code') setCodeError(err.msg);
                });
            } else {
                setGeneralError(
                    error.response?.data?.message ||
                    error.userMessage ||
                    error.message ||
                    'El código ingresado es incorrecto o ha expirado.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || loading) return;
        setCodeError('');
        setGeneralError('');
        setLoading(true);
        try {
            await resendVerificationCode(registeredEmail || email.trim(), 'register');
            setResendCooldown(30);
            if (Platform.OS === 'web') {
                alert('Se ha enviado un nuevo código de verificación a tu correo.');
            } else {
                Alert.alert(
                    'Código Reenviado',
                    'Se ha enviado un nuevo código de verificación a tu correo electrónico.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error al reenviar código:', error);
            setGeneralError(
                error.response?.data?.message ||
                error.message ||
                'No se pudo reenviar el código. Intenta nuevamente en unos momentos.'
            );
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
                    <Text style={styles.title}>🦎 VetExóticos</Text>
                    <Text style={styles.subtitle}>
                        {step === 1 
                            ? (currentUser && currentUser.rol === 'admin' 
                                ? 'Registrar nuevo usuario desde Admin' 
                                : 'Crea tu cuenta en VetExóticos')
                            : 'Confirmar Identidad'}
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

                        {step === 1 ? (
                            <View>
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

                                {/* Selector de rol únicamente si el usuario activo es administrador */}
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
                        ) : (
                            <View>
                                <Text style={styles.instructions}>
                                    Hemos enviado un código de 6 dígitos a <Text style={{ fontWeight: 'bold' }}>{registeredEmail || email}</Text>. Ingresa el código para confirmar tu identidad y completar tu registro.
                                </Text>

                                <Text style={styles.label}>Código de Verificación</Text>
                                <TextInput
                                    style={[styles.input, codeError ? styles.inputError : null]}
                                    placeholder="123456"
                                    value={code}
                                    onChangeText={text => { setCode(text); setCodeError(''); }}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!loading}
                                    autoComplete="one-time-code"
                                    textContentType="oneTimeCode"
                                    importantForAutofill="no"
                                    autoFocus
                                />
                                {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}

                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleVerifyCode}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Confirmar Identidad</Text>
                                    )}
                                </TouchableOpacity>

                                <View style={styles.helperLinks}>
                                    <TouchableOpacity
                                        style={styles.halfLink}
                                        onPress={handleResendCode}
                                        disabled={loading || resendCooldown > 0}
                                    >
                                        <Text style={[styles.linkText, (loading || resendCooldown > 0) && styles.linkTextDisabled]}>
                                            {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.halfLink}
                                        onPress={() => {
                                            setStep(1);
                                            setCode('');
                                            setCodeError('');
                                            setGeneralError('');
                                        }}
                                        disabled={loading}
                                    >
                                        <Text style={styles.linkText}>Cambiar cuenta</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
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
    instructions: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    codeInput: {
        textAlign: 'center',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 8,
        paddingVertical: 14,
    },
    verifyHelperText: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    emailHighlight: {
        fontWeight: 'bold',
        color: '#2563eb',
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
    helperLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 18,
    },
    halfLink: {
        padding: 8,
    },
    linkText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
    linkTextDisabled: {
        color: '#94a3b8',
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
