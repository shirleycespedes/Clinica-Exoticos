/**
 * Rutas de Reportes
 * @description Mapea los endpoints de exportación a Excel, PDF y generación de facturas
 */

const express = require('express');
const router = express.Router();
const ReporteController = require('../controllers/reporteController');
const { authenticateToken, authorizeAdmin, authorizeClienteOrAdmin } = require('../middleware/auth');
const Pedido = require('../models/Pedido');

const { pool } = require('../config/database');

// Middleware para verificar propiedad de la factura (Admin o el propio Cliente dueño del pedido)
const checkInvoiceOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pedido = await Pedido.findById(id);
        if (!pedido) {
            return res.status(404).send('El pedido especificado no existe.');
        }

        // Si no es admin y tampoco es el cliente que realizó el pedido, denegar acceso
        if (req.user.rol !== 'admin' && pedido.usuario_id !== req.user.userId && pedido.usuarios_id !== req.user.userId) {
            return res.status(403).send('No tiene permisos para descargar esta factura.');
        }

        next();
    } catch (error) {
        console.error('Error al verificar propiedad de factura:', error);
        res.status(500).send('Error interno al verificar permisos de la factura.');
    }
};

// Middleware para verificar permisos de exportación (Clientes solo pueden exportar sus propios pacientes, consultas o expedientes)
const checkExportOwnership = async (req, res, next) => {
    try {
        const { modulo } = req.params;
        const { pacienteId, expedienteId } = req.query;

        // Administrador tiene acceso a todo
        if (req.user.rol === 'admin') {
            return next();
        }

        // Cliente tiene acceso limitado
        if (req.user.rol === 'cliente') {
            if (modulo !== 'pacientes' && modulo !== 'consultas' && modulo !== 'expedientes') {
                return res.status(403).json({ success: false, message: 'Acceso denegado', error: 'No tiene permisos para exportar este módulo.' });
            }

            if (modulo === 'expedientes') {
                if (!expedienteId) {
                    return res.status(400).json({ success: false, message: 'Solicitud inválida', error: 'Se requiere especificar el ID del expediente para exportar.' });
                }

                // Consultar si el expediente pertenece a una mascota del propietario asociado al usuario autenticado
                const [rows] = await pool.query(
                    `SELECT e.id 
                     FROM expedientes e
                     JOIN pacientes p ON e.paciente_id = p.id
                     JOIN propietarios pr ON p.propietario_id = pr.id
                     WHERE e.id = ? AND pr.usuario_id = ?`,
                    [expedienteId, req.user.userId]
                );

                if (rows.length === 0) {
                    return res.status(403).json({ success: false, message: 'Acceso denegado', error: 'No tiene propiedad ni permisos sobre este expediente.' });
                }

                return next();
            } else {
                if (!pacienteId) {
                    return res.status(400).json({ success: false, message: 'Solicitud inválida', error: 'Se requiere especificar el ID del paciente para exportar.' });
                }

                // Consultar si el paciente pertenece al propietario asociado al usuario autenticado
                const [rows] = await pool.query(
                    `SELECT p.id 
                     FROM pacientes p
                     JOIN propietarios pr ON p.propietario_id = pr.id
                     WHERE p.id = ? AND pr.usuario_id = ?`,
                    [pacienteId, req.user.userId]
                );

                if (rows.length === 0) {
                    return res.status(403).json({ success: false, message: 'Acceso denegado', error: 'No tiene propiedad ni permisos sobre esta mascota.' });
                }

                return next();
            }
        }

        return res.status(403).json({ success: false, message: 'Acceso denegado', error: 'Rol no autorizado.' });
    } catch (error) {
        console.error('Error en checkExportOwnership:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
};

// Rutas de Exportación a Excel y PDF (Solo Administradores, o Clientes con control de pertenencia)
router.get('/exportar/excel/:modulo', authenticateToken, authorizeClienteOrAdmin, checkExportOwnership, ReporteController.exportarExcel);
router.get('/exportar/pdf/:modulo', authenticateToken, authorizeClienteOrAdmin, checkExportOwnership, ReporteController.exportarPDF);

// Ruta para descargar Factura PDF (Administradores y Clientes dueños del pedido)
router.get('/factura/:id', authenticateToken, authorizeClienteOrAdmin, checkInvoiceOwnership, ReporteController.generarFactura);

module.exports = router;
