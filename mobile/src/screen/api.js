import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base de producción en Railway (en la nube)
const RAILWAY_API_URL = 'https://clinica-exoticos-production.up.railway.app/api/v1';

// URL base definitiva para la aplicación móvil y web
const getBaseURL = () => {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl && envUrl.trim() !== '') {
        return envUrl.trim().replace(/\/+$/, '');
    }
    return RAILWAY_API_URL;
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para solicitudes HTTP:
// 1. Evita duplicación de prefijo /api/v1 en config.url
// 2. Inyecta automáticamente el token JWT Bearer en todas las peticiones autenticadas
api.interceptors.request.use(
    async (config) => {
        try {
            // Protección contra duplicación de /api/v1
            if (config.url) {
                if (config.url.startsWith('/api/v1/')) {
                    config.url = config.url.replace('/api/v1', '');
                } else if (config.url.startsWith('api/v1/')) {
                    config.url = config.url.replace('api/v1', '');
                }
            }

            // Inyección del token de autenticación
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error al configurar headers de petición api:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejo global de respuestas (ej. token expirado o sesión inválida)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('⚠️ Sesión expirada o no autorizada (401) en:', error.config?.url);
        }
        return Promise.reject(error);
    }
);

export default api;
