import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// IP de respaldo por si falla la detección dinámica
const FALLBACK_IP = '192.168.0.90';

// Detecta dinámicamente la IP de la máquina servidor (Metro) para evitar errores de red al apagar/reiniciar
const getBaseURL = () => {
    // 1. En la web (navegador), usar el hostname de la barra de direcciones
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        return `http://${window.location.hostname}:3000/api/v1`;
    }

    // 2. En celular/emulador, obtener la IP dinámica del servidor de desarrollo de Metro
    try {
        const scriptURL = NativeModules?.SourceCode?.scriptURL;
        if (scriptURL) {
            const match = scriptURL.match(/http:\/\/([^:]+):/);
            if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
                console.log('IP de servidor de desarrollo autodetectada:', match[1]);
                return `http://${match[1]}:3000/api/v1`;
            }
        }
    } catch (err) {
        console.warn('Error al autodetectar IP del servidor de desarrollo:', err);
    }

    // 3. Fallback de respaldo
    return `http://${FALLBACK_IP}:3000/api/v1`;
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para inyectar automáticamente el token JWT en todas las peticiones
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error al recuperar el token para la petición:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;