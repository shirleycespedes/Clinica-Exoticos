import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        
        if (response.data.success) {
            await AsyncStorage.setItem('token', response.data.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
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
            if (!token) {
                await AsyncStorage.setItem('token', response.data.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
            }
            return response.data;
        }
    } catch (error) {
        throw error;
    }
};

export const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
};

export const getCurrentUser = async () => {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};