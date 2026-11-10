import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from './notificationService';

export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        
        if (response.data.success) {
            if (response.data.data?.token) {
                await AsyncStorage.setItem('token', response.data.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
                registerForPushNotificationsAsync().catch(() => {});
            }
            return response.data;
        }
    } catch (error) {
        throw error;
    }
};

export const verifyLoginCode = async (email, code) => {
    try {
        const response = await api.post('/auth/verify-login', { email, code });

        if (response.data.success) {
            await AsyncStorage.setItem('token', response.data.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
            registerForPushNotificationsAsync().catch(() => {});
            return response.data;
        }
    } catch (error) {
        throw error;
    }
};

export const register = async (nombre, email, password, telefono, rol = 'cliente', cedula) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await api.post(
            '/auth/register', 
            { nombre, email, password, telefono, rol, cedula },
            { headers }
        );
        
        if (response.data.success) {
            if (!token && response.data.data?.token) {
                await AsyncStorage.setItem('token', response.data.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
                registerForPushNotificationsAsync().catch(() => {});
            }
            return response.data;
        }
    } catch (error) {
        throw error;
    }
};

export const resendVerificationCode = async (email, type = 'register') => {
    try {
        const response = await api.post('/auth/resend-code', { email, type });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const verifyRegisterCode = async (email, code) => {
    return verifyLoginCode(email, code);
};

export const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
};

export const getCurrentUser = async () => {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const forgotPassword = async (email) => {
    try {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const resetPassword = async (email, code, newPassword) => {
    try {
        const response = await api.post('/auth/reset-password', { email, code, newPassword });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const loginWithGoogle = async (idToken) => {
    try {
        const response = await api.post('/auth/google', { idToken });
        if (response.data.success) {
            await AsyncStorage.setItem('token', response.data.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
            registerForPushNotificationsAsync().catch(() => {});
            return response.data;
        }
    } catch (error) {
        throw error;
    }
};
