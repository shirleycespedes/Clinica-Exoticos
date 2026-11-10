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
    Alert,
    Modal,
    ScrollView,
} from 'react-native';
import { login, verifyLoginCode } from './authService';

export default function LoginScreen({ route, navigation }) {
    const [step, setStep] = useState(1); // 1: Credenciales, 2: Confirmar identidad por código
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [policiesModalVisible, setPoliciesModalVisible] = useState(false);

    // Estados de errores de validación
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [codeError, setCodeError] = useState('');
    const [generalError, setGeneralError] = useState('');

    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            try {
                const msg = localStorage.getItem('resetSuccess');
                if (msg) {
                    setSuccessMessage(msg);
                    localStorage.removeItem('resetSuccess');
                }
            } catch (err) {
                console.warn('Error reading from localStorage:', err);
            }
        }
    }, []);

    // Limpiar campos y errores cuando la pantalla recibe foco
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setStep(1);
            setEmail('');
            setPassword('');
            setCode('');
            setEmailError('');
            setPasswordError('');
            setCodeError('');
            setGeneralError('');
        });

        return unsubscribe;
    }, [navigation]);

    const handleLogin = async () => {
        setEmailError('');
        setPasswordError('');
        setCodeError('');
        setGeneralError('');

        let isValid = true;

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

        if (!password) {
            setPasswordError('La contraseña es requerida.');
            isValid = false;
        }

        if (!isValid) return;

        setLoading(true);
        try {
            const response = await login(email.trim(), password);
            if (response?.requireVerification) {
                if (Platform.OS === 'web') {
                    alert('Se ha enviado un código de verificación a tu correo electrónico para confirmar tu identidad.');
                } else {
                    Alert.alert(
                        'Código Enviado',
                        'Se ha enviado un código de verificación a tu correo electrónico para confirmar tu identidad.',
                        [{ text: 'OK' }]
                    );
                }
                setCode('');
                setStep(2);
            } else {
                navigation.replace('Dashboard');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            
            // Mapear errores del backend
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach(err => {
                    if (err.path === 'email') setEmailError(err.msg);
                    else if (err.path === 'password') setPasswordError(err.msg);
                });
            } else {
                setGeneralError(
                    error.response?.data?.message || 
                    error.userMessage ||
                    error.message || 
                    'Error al iniciar sesión'
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
            setCodeError('El código es requerido.');
            return;
        } else if (code.trim().length !== 6 || !/^\d{6}$/.test(code.trim())) {
            setCodeError('El código debe tener exactamente 6 dígitos numéricos.');
            return;
        }

        setLoading(true);
        try {
            await verifyLoginCode(email.trim(), code.trim());
            navigation.replace('Dashboard');
        } catch (error) {
            console.error('Error al verificar código de identidad:', error);

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
                    'Error al verificar el código de identidad.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setCodeError('');
        setGeneralError('');
        setLoading(true);
        try {
            await login(email.trim(), password);
            if (Platform.OS === 'web') {
                alert('Se ha reenviado un nuevo código de verificación a tu correo electrónico.');
            } else {
                Alert.alert(
                    'Código Reenviado',
                    'Se ha reenviado un nuevo código de verificación a tu correo electrónico.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error al reenviar código:', error);
            setGeneralError(
                error.response?.data?.message ||
                error.message ||
                'Error al reenviar el código de verificación.'
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
            <View style={styles.content}>
                <Text style={styles.title}>🦎 VetExóticos</Text>
                <Text style={styles.subtitle}>
                    {step === 1 ? 'Clínica de Animales Exóticos' : 'Confirmar Identidad'}
                </Text>

                    <View style={styles.form}>
                        {/* Inputs invisibles para absorber el autocompletado automático de los navegadores */}
                        {Platform.OS === 'web' && (
                            <View style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }} pointerEvents="none">
                                <TextInput autoComplete="username" />
                                <TextInput autoComplete="current-password" secureTextEntry />
                            </View>
                        )}

                        {(successMessage || route?.params?.successMessage) && step === 1 ? (
                            <View style={styles.successBanner}>
                                <Text style={styles.successBannerText}>✅ {successMessage || route?.params?.successMessage}</Text>
                            </View>
                        ) : null}

                        {generalError ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorBannerText}>⚠️ {generalError}</Text>
                            </View>
                        ) : null}

                        {step === 1 ? (
                            <View>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={[styles.input, emailError ? styles.inputError : null]}
                                    placeholder="Ingresa tu email"
                                    value={email}
                                    onChangeText={text => { setEmail(text); setEmailError(''); }}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!loading}
                                    autoComplete="new-password"
                                    textContentType="none"
                                    importantForAutofill="no"
                                />
                                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                                <Text style={styles.label}>Contraseña</Text>
                                <TextInput
                                    style={[styles.input, passwordError ? styles.inputError : null]}
                                    placeholder="Ingresa tu contraseña"
                                    value={password}
                                    onChangeText={text => { setPassword(text); setPasswordError(''); }}
                                    secureTextEntry
                                    editable={!loading}
                                    autoComplete="new-password"
                                    textContentType="none"
                                    importantForAutofill="no"
                                />
                                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                                <TouchableOpacity 
                                    style={styles.forgotPasswordContainer} 
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                    disabled={loading}
                                >
                                    <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.button} 
                                    onPress={handleLogin} 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Iniciar Sesión</Text>
                                    )}
                                </TouchableOpacity>

                                <View style={styles.registerContainer}>
                                    <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
                                        <Text style={styles.registerLink}>Regístrate</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.instructions}>
                                    Hemos enviado un código de 6 dígitos a <Text style={{ fontWeight: 'bold' }}>{email}</Text>. Ingresa el código para confirmar tu identidad e iniciar sesión.
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
                                        disabled={loading}
                                    >
                                        <Text style={styles.linkText}>Reenviar código</Text>
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

                        {/* Enlace a Políticas de Uso y Privacidad */}
                        <View style={styles.policiesWrapper}>
                            <TouchableOpacity 
                                style={styles.policiesButton}
                                onPress={() => setPoliciesModalVisible(true)}
                                disabled={loading}
                            >
                                <Text style={styles.policiesText}>📋 Términos y Políticas de Uso</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

            {/* Modal de Políticas de Uso y Privacidad */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={policiesModalVisible}
                onRequestClose={() => setPoliciesModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>📋 Políticas de Uso</Text>
                                <Text style={styles.modalSubtitle}>Clínica Veterinaria VetExóticos</Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setPoliciesModalVisible(false)} 
                                style={styles.modalCloseIcon}
                            >
                                <Text style={styles.modalCloseIconText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.modalScroll} 
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={styles.modalScrollContent}
                        >
                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>1. 🦎 Aceptación de los Términos</Text>
                                <Text style={styles.policyParagraph}>
                                    Al registrarte, iniciar sesión o utilizar los servicios de la aplicación de VetExóticos, aceptas y te comprometes a cumplir plenamente con estas políticas de uso y privacidad.
                                </Text>
                            </View>

                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>2. 🔐 Cuenta y Seguridad (2FA)</Text>
                                <Text style={styles.policyParagraph}>
                                    Para proteger la información médica de tus mascotas y tus datos personales, VetExóticos implementa verificación de identidad en dos pasos mediante un código seguro enviado a tu correo electrónico. Eres responsable de mantener la confidencialidad de tus credenciales.
                                </Text>
                            </View>

                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>3. 📅 Citas y Atención Especializada</Text>
                                <Text style={styles.policyParagraph}>
                                    Las citas se programan según los horarios disponibles del personal veterinario especializado en fauna exótica. En caso de no poder asistir, te solicitamos cancelar o reprogramar tu cita con la debida anticipación. Las urgencias médicas tienen prioridad.
                                </Text>
                            </View>

                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>4. 📂 Expedientes Clínicos Digitales</Text>
                                <Text style={styles.policyParagraph}>
                                    Los historiales médicos, diagnósticos, recetas y tratamientos registrados en el expediente digital son estrictamente confidenciales y forman parte del registro clínico profesional de cada paciente exótico.
                                </Text>
                            </View>

                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>5. 🛍️ Tienda y Retiro de Productos</Text>
                                <Text style={styles.policyParagraph}>
                                    Los pedidos realizados mediante la aplicación se preparan para su retiro o pago en la clínica, o a través de los métodos de pago habilitados. Los suplementos y alimentos especializados deben administrarse siguiendo las indicaciones veterinarias.
                                </Text>
                            </View>

                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>6. 🛡️ Protección de Datos Personales</Text>
                                <Text style={styles.policyParagraph}>
                                    Tus datos personales (nombre, correo electrónico, teléfono, cédula) serán utilizados exclusivamente para la gestión de citas, expedientes, compras y comunicación sobre la salud de tus mascotas. No compartimos tu información con terceros sin tu consentimiento.
                                </Text>
                            </View>

                            <View style={styles.policySection}>
                                <Text style={styles.policyHeading}>7. 🌿 Bienestar y Tenencia Responsable</Text>
                                <Text style={styles.policyParagraph}>
                                    VetExóticos promueve la tenencia responsable, el respeto y la conservación de la fauna silvestre y exótica de acuerdo con la legislación ambiental aplicable.
                                </Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity 
                            style={styles.modalAcceptButton} 
                            onPress={() => setPoliciesModalVisible(false)}
                        >
                            <Text style={styles.modalAcceptButtonText}>Entendido y Aceptar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
    },
    title: {
        fontSize: 36,
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
    instructions: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
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
        borderColor: '#bbf7d0',
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
        marginTop: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    registerText: {
        color: '#666',
        fontSize: 14,
    },
    registerLink: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: 'bold',
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 15,
        marginTop: 0,
    },
    forgotPasswordText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
    helperLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    halfLink: {
        paddingVertical: 5,
    },
    linkText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: 'bold',
    },
    policiesWrapper: {
        marginTop: 18,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        alignItems: 'center',
    },
    policiesButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    policiesText: {
        fontSize: 13,
        color: '#2563eb',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        maxHeight: '85%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 12,
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    modalCloseIcon: {
        padding: 4,
        marginLeft: 10,
    },
    modalCloseIconText: {
        fontSize: 18,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    modalScroll: {
        marginBottom: 15,
    },
    modalScrollContent: {
        paddingRight: 4,
        paddingBottom: 10,
    },
    policySection: {
        marginBottom: 14,
    },
    policyHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563eb',
        marginBottom: 4,
    },
    policyParagraph: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 19,
    },
    modalAcceptButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 13,
        alignItems: 'center',
    },
    modalAcceptButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
