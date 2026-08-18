import React, { useState } from 'react';
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
} from 'react-native';
import { forgotPassword, resetPassword } from './authService';

export default function ForgotPasswordScreen({ navigation }) {
    const [step, setStep] = useState(1); // 1: Solicitar código, 2: Restablecer contraseña
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Estados de errores
    const [emailError, setEmailError] = useState('');
    const [codeError, setCodeError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');

    const handleSendCode = async () => {
        setEmailError('');
        setGeneralError('');

        if (!email.trim()) {
            setEmailError('El email es requerido.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setEmailError('Por favor ingresa un email válido.');
            return;
        }

        setLoading(true);
        try {
            await forgotPassword(email.trim());
            if (Platform.OS === 'web') {
                alert('Se ha enviado un código de recuperación a tu correo electrónico.');
            } else {
                Alert.alert(
                    'Código Enviado',
                    'Se ha enviado un código de recuperación a tu correo electrónico.',
                    [{ text: 'OK' }]
                );
            }
            setStep(2);
        } catch (error) {
            console.error('Error al enviar código:', error);
            setGeneralError(
                error.response?.data?.message || 
                error.message || 
                'Error al enviar el código de recuperación.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setCodeError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setGeneralError('');

        let isValid = true;

        if (!code.trim()) {
            setCodeError('El código es requerido.');
            isValid = false;
        } else if (code.trim().length !== 6) {
            setCodeError('El código debe tener exactamente 6 dígitos.');
            isValid = false;
        }

        if (!newPassword) {
            setPasswordError('La contraseña es requerida.');
            isValid = false;
        } else if (newPassword.length < 6) {
            setPasswordError('La contraseña debe tener al menos 6 caracteres.');
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            setConfirmPasswordError('Las contraseñas no coinciden.');
            isValid = false;
        }

        if (!isValid) return;

        setLoading(true);
        console.log('Starting resetPassword API request for email:', email.trim());
        try {
            // Fire the request in the background
            resetPassword(email.trim(), code.trim(), newPassword).catch(err => {
                console.error('Background resetPassword error:', err);
            });
            
            // Go back to Login using the safest navigation method
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                error.response.data.errors.forEach(err => {
                    const path = err.path || err.param;
                    if (path === 'code') setCodeError(err.msg);
                    else if (path === 'newPassword') setPasswordError(err.msg);
                });
            } else {
                setGeneralError(
                    error.response?.data?.message || 
                    error.message || 
                    'Error al restablecer la contraseña.'
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
            <View style={styles.content}>
                <Text style={styles.title}>🦎 VetExóticos</Text>
                <Text style={styles.subtitle}>Recuperar Contraseña</Text>

                <View style={styles.form}>
                    {successMsg ? (
                        <View style={styles.successContainer}>
                            <Text style={styles.successIconText}>✅</Text>
                            <Text style={styles.successTitle}>Contraseña Actualizada</Text>
                            <Text style={styles.successMessage}>{successMsg}</Text>
                        </View>
                    ) : (
                        <>
                            {generalError ? (
                                <View style={styles.errorBanner}>
                                    <Text style={styles.errorBannerText}>⚠️ {generalError}</Text>
                                </View>
                            ) : null}

                            {step === 1 ? (
                        // PASO 1: Solicitar código
                        <View>
                            <Text style={styles.instructions}>
                                Ingresa tu correo electrónico registrado y te enviaremos un código de 6 dígitos para restablecer tu contraseña.
                            </Text>

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, emailError ? styles.inputError : null]}
                                placeholder="tu-correo@gmail.com"
                                value={email}
                                onChangeText={text => { setEmail(text); setEmailError(''); }}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                            />
                            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                            <TouchableOpacity 
                                style={styles.button} 
                                onPress={handleSendCode} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Enviar Código</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.linkContainer} 
                                onPress={() => navigation.navigate('Login')}
                                disabled={loading}
                            >
                                <Text style={styles.linkText}>Volver al inicio de sesión</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // PASO 2: Verificar código y restablecer
                        <View>
                            <Text style={styles.instructions}>
                                Código enviado a <Text style={{ fontWeight: 'bold' }}>{email}</Text>. Revisa tu bandeja de entrada.
                            </Text>

                            <Text style={styles.label}>Código de Recuperación</Text>
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

                            <Text style={styles.label}>Nueva Contraseña</Text>
                            <TextInput
                                style={[styles.input, passwordError ? styles.inputError : null]}
                                placeholder="Mínimo 6 caracteres"
                                value={newPassword}
                                onChangeText={text => { setNewPassword(text); setPasswordError(''); }}
                                secureTextEntry
                                editable={!loading}
                                autoComplete="new-password"
                                textContentType="newPassword"
                            />
                            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                            <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                            <TextInput
                                style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                                placeholder="Confirma tu nueva contraseña"
                                value={confirmPassword}
                                onChangeText={text => { setConfirmPassword(text); setConfirmPasswordError(''); }}
                                secureTextEntry
                                editable={!loading}
                                autoComplete="new-password"
                                textContentType="newPassword"
                            />
                            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

                            <TouchableOpacity 
                                style={styles.button} 
                                onPress={handleResetPassword} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Restablecer Contraseña</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.helperLinks}>
                                <TouchableOpacity 
                                    style={styles.halfLink} 
                                    onPress={handleSendCode}
                                    disabled={loading}
                                >
                                    <Text style={styles.linkText}>Reenviar código</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.halfLink} 
                                    onPress={() => setStep(1)}
                                    disabled={loading}
                                >
                                    <Text style={styles.linkText}>Cambiar correo</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity 
                                style={styles.linkContainer} 
                                onPress={() => navigation.navigate('Login')}
                                disabled={loading}
                            >
                                <Text style={styles.linkText}>Cancelar y volver al Login</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                        </>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
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
        marginBottom: 40,
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
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 5,
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
        marginTop: 2,
        marginBottom: 5,
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
    button: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: 'bold',
    },
    helperLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    halfLink: {
        paddingVertical: 5,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    successIconText: {
        fontSize: 50,
        marginBottom: 15,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#10b981',
        marginBottom: 10,
    },
    successMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
});
