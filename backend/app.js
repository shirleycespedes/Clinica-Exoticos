/**
 * Aplicación Express con MySQL - Clínica de Animales Exóticos
 * @description API REST para gestión de veterinaria de animales exóticos
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar configuraciones
const { testConnection } = require('./src/config/database');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const propietarioRoutes = require('./src/routes/propietarioRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
const expedienteRoutes = require('./src/routes/expedienteRoutes');
const citaRoutes = require('./src/routes/citaRoutes');
const consultaRoutes = require('./src/routes/consultaRoutes');
const productoRoutes = require('./src/routes/productoRoutes');
const pedidoRoutes = require('./src/routes/pedidoRoutes');

// Crear aplicación Express
const app = express();

// Configuración del puerto
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

/**
 * CONFIGURACIÓN DE MIDDLEWARES
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tu-dominio.com'] 
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logging de requests (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

/**
 * CONFIGURACIÓN DE RUTAS
 */

// Ruta de health check
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🐾 API Clínica de Animales Exóticos funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: `${API_PREFIX}/auth`,
            propietarios: `${API_PREFIX}/propietarios`,
            pacientes: `${API_PREFIX}/pacientes`,
            expedientes: `${API_PREFIX}/expedientes`,
            citas: `${API_PREFIX}/citas`,
            consultas: `${API_PREFIX}/consultas`
        }
    });
});

// Ruta de health check para monitoreo
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.status(200).json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbConnected ? 'connected' : 'disconnected',
                server: 'running'
            }
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Rutas de la API
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/propietarios`, propietarioRoutes);
app.use(`${API_PREFIX}/pacientes`, pacienteRoutes);
app.use(`${API_PREFIX}/expedientes`, expedienteRoutes);
app.use(`${API_PREFIX}/citas`, citaRoutes);
app.use(`${API_PREFIX}/consultas`, consultaRoutes);
app.use(`${API_PREFIX}/productos`, productoRoutes);
app.use(`${API_PREFIX}/pedidos`, pedidoRoutes);

/**
 * MANEJO DE ERRORES
 */

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        requestedUrl: req.originalUrl,
        availableEndpoints: {
            health: '/',
            docs: '/docs',
            auth: `${API_PREFIX}/auth`,
            propietarios: `${API_PREFIX}/propietarios`,
            pacientes: `${API_PREFIX}/pacientes`,
            expedientes: `${API_PREFIX}/expedientes`,
            citas: `${API_PREFIX}/citas`,
            consultas: `${API_PREFIX}/consultas`
        }
    });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error global:', err);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'JSON malformado',
            error: 'La estructura del JSON enviado no es válida'
        });
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'Payload demasiado grande',
            error: 'El tamaño de los datos enviados excede el límite permitido'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'production' 
            ? 'Algo salió mal en el servidor' 
            : err.message,
        timestamp: new Date().toISOString()
    });
});

/**
 * INICIALIZACIÓN DEL SERVIDOR
 */
const initializeApp = async () => {
    try {
        console.log('🔍 Verificando conexión a la base de datos...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos');
            console.log('💡 Asegúrate de que MySQL esté ejecutándose y las credenciales sean correctas');
            console.log('💡 Revisa el archivo .env para la configuración de la base de datos');
        }

        const server = app.listen(PORT, () => {
            console.log('🚀 Servidor iniciado correctamente');
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📋 API Base: http://localhost:${PORT}${API_PREFIX}`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🐾 Clínica de Animales Exóticos API`);
        });

        process.on('SIGTERM', () => {
            console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('🛑 Recibida señal SIGINT (Ctrl+C), cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error.message);
        process.exit(1);
    }
};

// Inicializar aplicación
if (require.main === module) {
    initializeApp();
}

module.exports = app;