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
} from 'react-native';
import { login } from './authService';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados de errores de validación
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');

    const handleLogin = async () => {
        setEmailError('');
        setPasswordError('');
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
            await login(email, password);
            navigation.replace('Dashboard');
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
                    error.message || 
                    'Error al iniciar sesión'
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
                <Text style={styles.subtitle}>Clínica de Animales Exóticos</Text>

                <View style={styles.form}>
                    {generalError ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorBannerText}>⚠️ {generalError}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, emailError ? styles.inputError : null]}
                        placeholder="Ingresa tu email"
                        value={email}
                        onChangeText={text => { setEmail(text); setEmailError(''); }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={[styles.input, passwordError ? styles.inputError : null]}
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChangeText={text => { setPassword(text); setPasswordError(''); }}
                        secureTextEntry
                    />
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

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
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerLink}>Regístrate</Text>
                        </TouchableOpacity>
                    </View>
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
});