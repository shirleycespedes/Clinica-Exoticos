/**
 * Controlador de Reportes y Exportación
 * @description Genera reportes en formato Excel (.xlsx) y PDF (.pdf) para los diferentes módulos y pedidos/facturas
 */

const { pool } = require('../config/database');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const Pedido = require('../models/Pedido');

class ReporteController {
    /**
     * Obtiene los datos del módulo solicitado
     */
    static async getModuleData(modulo, pacienteId = null, expedienteId = null) {
        let query = '';
        switch (modulo) {
            case 'inventario':
                query = `
                    SELECT id, nombre, descripcion, precio, stock, iva, 
                           IF(activo = 1, 'Activo', 'Inactivo') as estado 
                    FROM productos 
                    ORDER BY nombre ASC
                `;
                const [products] = await pool.query(query);
                return products;

            case 'consultas':
                if (pacienteId) {
                    query = `
                        SELECT c.id, DATE_FORMAT(c.fecha, '%Y-%m-%d %H:%i') as fecha, c.motivo, c.sintomas, 
                               c.observaciones, c.veterinario, c.peso_registrado, c.temperatura,
                               p.nombre as paciente_nombre, 
                               CONCAT(pr.nombre, ' ', pr.apellido) as propietario_nombre
                        FROM consultas c
                        JOIN expedientes e ON c.expediente_id = e.id
                        JOIN pacientes p ON e.paciente_id = p.id
                        JOIN propietarios pr ON p.propietario_id = pr.id
                        WHERE p.id = ?
                        ORDER BY c.fecha DESC
                    `;
                    const [consultations] = await pool.query(query, [pacienteId]);
                    return consultations;
                } else {
                    query = `
                        SELECT c.id, DATE_FORMAT(c.fecha, '%Y-%m-%d %H:%i') as fecha, c.motivo, c.sintomas, 
                               c.observaciones, c.veterinario, c.peso_registrado, c.temperatura,
                               p.nombre as paciente_nombre, 
                               CONCAT(pr.nombre, ' ', pr.apellido) as propietario_nombre
                        FROM consultas c
                        JOIN expedientes e ON c.expediente_id = e.id
                        JOIN pacientes p ON e.paciente_id = p.id
                        JOIN propietarios pr ON p.propietario_id = pr.id
                        ORDER BY c.fecha DESC
                    `;
                    const [consultations] = await pool.query(query);
                    return consultations;
                }

            case 'expedientes':
                if (expedienteId) {
                    query = `
                        SELECT e.id, DATE_FORMAT(e.fecha_apertura, '%Y-%m-%d') as fecha_apertura, 
                               IFNULL(DATE_FORMAT(e.fecha_cierre, '%Y-%m-%d'), 'Abierto') as fecha_cierre,
                               e.notas_generales, e.alergias, e.enfermedades_cronicas, e.vacunas,
                               p.nombre as paciente_nombre, p.especie,
                               CONCAT(pr.nombre, ' ', pr.apellido) as propietario_nombre
                        FROM expedientes e
                        JOIN pacientes p ON e.paciente_id = p.id
                        JOIN propietarios pr ON p.propietario_id = pr.id
                        WHERE e.id = ?
                        ORDER BY e.fecha_apertura DESC
                    `;
                    const [records] = await pool.query(query, [expedienteId]);
                    return records;
                } else {
                    query = `
                        SELECT e.id, DATE_FORMAT(e.fecha_apertura, '%Y-%m-%d') as fecha_apertura, 
                               IFNULL(DATE_FORMAT(e.fecha_cierre, '%Y-%m-%d'), 'Abierto') as fecha_cierre,
                               e.notas_generales, e.alergias, e.enfermedades_cronicas, e.vacunas,
                               p.nombre as paciente_nombre, p.especie,
                               CONCAT(pr.nombre, ' ', pr.apellido) as propietario_nombre
                        FROM expedientes e
                        JOIN pacientes p ON e.paciente_id = p.id
                        JOIN propietarios pr ON p.propietario_id = pr.id
                        ORDER BY e.fecha_apertura DESC
                    `;
                    const [records] = await pool.query(query);
                    return records;
                }

            case 'pacientes':
                if (pacienteId) {
                    query = `
                        SELECT p.id, p.nombre, p.especie, p.tipo_animal, p.sexo, p.peso, 
                               IFNULL(DATE_FORMAT(p.fecha_nacimiento, '%Y-%m-%d'), 'N/A') as fecha_nacimiento,
                               IFNULL(p.microchip, 'N/A') as microchip,
                               CONCAT(pr.nombre, ' ', pr.apellido) as propietario_nombre,
                               pr.email as propietario_email, pr.telefono as propietario_telefono
                        FROM pacientes p
                        JOIN propietarios pr ON p.propietario_id = pr.id
                        WHERE p.id = ?
                        ORDER BY p.nombre ASC
                    `;
                    const [patients] = await pool.query(query, [pacienteId]);
                    return patients;
                } else {
                    query = `
                        SELECT p.id, p.nombre, p.especie, p.tipo_animal, p.sexo, p.peso, 
                               IFNULL(DATE_FORMAT(p.fecha_nacimiento, '%Y-%m-%d'), 'N/A') as fecha_nacimiento,
                               IFNULL(p.microchip, 'N/A') as microchip,
                               CONCAT(pr.nombre, ' ', pr.apellido) as propietario_nombre,
                               pr.email as propietario_email, pr.telefono as propietario_telefono
                        FROM pacientes p
                        JOIN propietarios pr ON p.propietario_id = pr.id
                        ORDER BY p.nombre ASC
                    `;
                    const [patients] = await pool.query(query);
                    return patients;
                }

            case 'clientes':
                query = `
                    SELECT u.id, u.nombre, u.email, IFNULL(u.telefono, 'N/A') as telefono, u.rol,
                           DATE_FORMAT(u.fecha_creacion, '%Y-%m-%d') as fecha_registro,
                           IFNULL(pr.cedula, 'N/A') as cedula
                    FROM usuarios u
                    LEFT JOIN propietarios pr ON pr.usuario_id = u.id
                    ORDER BY u.nombre ASC
                `;
                const [clients] = await pool.query(query);
                return clients;

            case 'tienda':
                query = `
                    SELECT id, nombre, descripcion, precio, stock, iva 
                    FROM productos 
                    WHERE activo = 1 
                    ORDER BY nombre ASC
                `;
                const [storeProducts] = await pool.query(query);
                return storeProducts;

            case 'pedidos':
                query = `
                    SELECT p.id, DATE_FORMAT(p.fecha_pedido, '%Y-%m-%d %H:%i') as fecha, p.subtotal, p.iva, p.total, 
                           p.estado, p.codigo_retiro,
                           u.nombre as cliente_nombre, u.email as cliente_email
                    FROM pedidos p
                    JOIN usuarios u ON p.usuario_id = u.id OR p.usuarios_id = u.id
                    ORDER BY p.fecha_pedido DESC
                `;
                const [orders] = await pool.query(query);
                return orders;

            default:
                throw new Error('Módulo no válido para exportación.');
        }
    }

    /**
     * Devuelve las cabeceras descriptivas en español para Excel
     */
    static getModuleHeaders(modulo) {
        switch (modulo) {
            case 'inventario':
                return ['ID', 'Nombre', 'Descripción', 'Precio', 'Existencias', 'IVA %', 'Estado'];
            case 'consultas':
                return ['ID Consulta', 'Fecha', 'Motivo', 'Síntomas', 'Observaciones', 'Veterinario', 'Peso (kg)', 'Temp (°C)', 'Paciente', 'Propietario'];
            case 'expedientes':
                return ['ID Expediente', 'Fecha Apertura', 'Fecha Cierre', 'Notas Generales', 'Alergias', 'Enfermedades Crónicas', 'Vacunas', 'Paciente', 'Especie', 'Propietario'];
            case 'pacientes':
                return ['ID Paciente', 'Nombre', 'Especie', 'Tipo Animal', 'Sexo', 'Peso', 'Fecha Nacimiento', 'Microchip', 'Propietario', 'Email Propietario', 'Teléfono Propietario'];
            case 'clientes':
                return ['ID Cliente', 'Nombre Completo', 'Email', 'Teléfono', 'Rol', 'Fecha Registro', 'Cédula'];
            case 'tienda':
                return ['ID Producto', 'Nombre', 'Descripción', 'Precio', 'Existencias', 'IVA %'];
            case 'pedidos':
                return ['ID Pedido', 'Fecha Pedido', 'Subtotal', 'IVA', 'Total', 'Estado', 'Código Retiro', 'Cliente', 'Email Cliente'];
            default:
                return [];
        }
    }

    /**
     * Exporta los datos de un módulo a formato Excel (.xlsx)
     */
    static async exportarExcel(req, res) {
        try {
            const { modulo } = req.params;
            const { pacienteId, expedienteId } = req.query;
            const rawData = await ReporteController.getModuleData(modulo, pacienteId, expedienteId);

            if (!rawData || rawData.length === 0) {
                return res.status(404).send('No se encontraron registros para exportar.');
            }

            // Traducir los nombres de las columnas a español para el archivo Excel
            const headers = ReporteController.getModuleHeaders(modulo);
            const formattedData = rawData.map(row => {
                const newRow = {};
                const keys = Object.keys(row);
                keys.forEach((key, idx) => {
                    newRow[headers[idx] || key] = row[key];
                });
                return newRow;
            });

            // Crear libro y hoja de cálculo
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(formattedData);

            // Ajustar ancho de columnas automáticamente
            const colWidths = headers.map(header => {
                let maxLen = header.length;
                formattedData.forEach(row => {
                    const cellVal = String(row[header] || '');
                    if (cellVal.length > maxLen) maxLen = cellVal.length;
                });
                return { wch: maxLen + 3 };
            });
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, modulo.toUpperCase());

            // Escribir en un buffer binario
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Reporte_${modulo}_${new Date().toISOString().split('T')[0]}.xlsx`);
            res.status(200).send(buffer);

        } catch (error) {
            console.error('Error al exportar Excel:', error);
            res.status(500).send(`Error interno del servidor al exportar a Excel: ${error.message}`);
        }
    }

    /**
     * Exporta los datos de un módulo a un reporte PDF elegante
     */
    static async exportarPDF(req, res) {
        try {
            const { modulo } = req.params;
            const { pacienteId, expedienteId } = req.query;
            const rawData = await ReporteController.getModuleData(modulo, pacienteId, expedienteId);

            if (!rawData || rawData.length === 0) {
                return res.status(404).send('No se encontraron registros para exportar.');
            }

            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Reporte_${modulo}_${new Date().toISOString().split('T')[0]}.pdf`);
            
            doc.pipe(res);

            // Cabecera del PDF
            doc.fillColor('#2563eb').fontSize(22).text('VetExóticos', { align: 'left' });
            doc.fillColor('#64748b').fontSize(10).text('Clínica de Animales Exóticos - Sistema de Control Veterinario', { align: 'left' });
            doc.moveDown(0.5);
            doc.fillColor('#1e293b').fontSize(14).text(`Reporte Oficial de: ${modulo.toUpperCase()}`, { underline: true });
            doc.fillColor('#64748b').fontSize(9).text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'right' });
            doc.moveDown(1);

            // Dibujar Tabla
            const headers = ReporteController.getModuleHeaders(modulo);
            const columnsCount = headers.length;
            const tableWidth = 780; // A4 landscape width = 842 - margins
            const colWidth = tableWidth / columnsCount;

            // Dibujar fila de cabecera
            const startX = 30;
            let currentY = doc.y;

            doc.rect(startX, currentY, tableWidth, 20).fill('#2563eb');
            doc.fillColor('#ffffff').fontSize(8);

            headers.forEach((header, idx) => {
                doc.text(header, startX + (idx * colWidth) + 5, currentY + 6, {
                    width: colWidth - 10,
                    align: 'left',
                    ellipsis: true
                });
            });

            currentY += 20;

            // Dibujar filas de datos
            doc.fillColor('#334155').fontSize(7);
            rawData.forEach((row, rowIndex) => {
                // Si la tabla pasa el límite de página, agregar página
                if (currentY > 500) {
                    doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
                    currentY = 40;
                    
                    // Repetir cabecera de tabla en nueva página
                    doc.rect(startX, currentY, tableWidth, 20).fill('#2563eb');
                    doc.fillColor('#ffffff').fontSize(8);
                    headers.forEach((header, idx) => {
                        doc.text(header, startX + (idx * colWidth) + 5, currentY + 6, {
                            width: colWidth - 10,
                            align: 'left',
                            ellipsis: true
                        });
                    });
                    currentY += 20;
                    doc.fillColor('#334155').fontSize(7);
                }

                // Color de fondo alternativo para las filas
                if (rowIndex % 2 === 0) {
                    doc.rect(startX, currentY, tableWidth, 18).fill('#f8fafc');
                } else {
                    doc.rect(startX, currentY, tableWidth, 18).fill('#ffffff');
                }
                
                doc.fillColor('#334155');

                const values = Object.values(row);
                values.forEach((val, colIdx) => {
                    const textVal = String(val === null || val === undefined ? '' : val);
                    doc.text(textVal, startX + (colIdx * colWidth) + 5, currentY + 5, {
                        width: colWidth - 10,
                        align: 'left',
                        height: 12,
                        ellipsis: true
                    });
                });

                currentY += 18;
            });

            // Pie de página
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('#94a3b8').text(
                    `Página ${i + 1} de ${pages.count} - Generado por VetExóticos`,
                    30,
                    555,
                    { align: 'center', width: tableWidth }
                );
            }

            doc.end();

        } catch (error) {
            console.error('Error al generar PDF:', error);
            res.status(500).send(`Error interno al generar el PDF: ${error.message}`);
        }
    }

    /**
     * Genera una Factura PDF para un pedido
     */
    static async generarFactura(req, res) {
        try {
            const { id } = req.params;
            const pedido = await Pedido.findById(id);

            if (!pedido) {
                return res.status(404).send('El pedido especificado no existe.');
            }

            const detalles = await Pedido.findDetailsByPedidoId(id);

            // Obtener datos del usuario/cliente
            const [userRows] = await pool.query(
                'SELECT nombre, email, telefono FROM usuarios WHERE id = ?',
                [pedido.usuario_id]
            );
            const cliente = userRows[0] || { nombre: 'Cliente General', email: 'N/A', telefono: 'N/A' };

            const doc = new PDFDocument({ margin: 40, size: 'A4' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Factura_Pedido_${id}.pdf`);

            doc.pipe(res);

            // 1. Encabezado / Logo
            doc.fillColor('#2563eb').fontSize(26).text('VetExóticos', { align: 'left' });
            doc.fillColor('#64748b').fontSize(10).text('Clínica de Animales Exóticos y Tienda Especializada', { align: 'left' });
            doc.text('Tel: +506 2200-3300  |  Email: facturacion@vetexoticos.com', { align: 'left' });
            doc.moveDown(1);

            // Línea divisoria
            doc.strokeColor('#e2e8f0').lineWidth(2).moveTo(40, 95).lineTo(550, 95).stroke();

            // 2. Información del Pedido / Cliente (dos columnas)
            const leftColX = 40;
            const rightColX = 320;
            let infoY = 115;

            // Columna Izquierda: Información de Facturación
            doc.fillColor('#1e293b').fontSize(12).text('DATOS DE FACTURACIÓN', leftColX, infoY, { underline: true });
            doc.fontSize(10).fillColor('#334155');
            doc.text(`Cliente: ${cliente.nombre}`, leftColX, infoY + 20);
            doc.text(`Email: ${cliente.email}`, leftColX, infoY + 35);
            doc.text(`Teléfono: ${cliente.telefono}`, leftColX, infoY + 50);

            // Columna Derecha: Detalles del Recibo
            doc.fillColor('#1e293b').fontSize(12).text('DETALLE DE FACTURA', rightColX, infoY, { underline: true });
            doc.fontSize(10).fillColor('#334155');
            doc.text(`N° Pedido: PED-${pedido.id.toString().padStart(6, '0')}`, rightColX, infoY + 20);
            doc.text(`Fecha: ${new Date(pedido.fecha_pedido).toLocaleString()}`, rightColX, infoY + 35);
            doc.text(`Código de Retiro: ${pedido.codigo_retiro}`, rightColX, infoY + 50);
            doc.fillColor('#2563eb').text(`Estado de Retiro: ${pedido.estado.toUpperCase()}`, rightColX, infoY + 65, { fontWeight: 'bold' });

            doc.moveDown(3);
            
            // 3. Tabla de Productos del Pedido
            let tableY = doc.y + 15;
            const tableWidth = 510;
            const colProductWidth = 250;
            const colQtyWidth = 70;
            const colPriceWidth = 90;
            const colTotalWidth = 100;

            // Encabezado de la tabla
            doc.rect(40, tableY, tableWidth, 22).fill('#2563eb');
            doc.fillColor('#ffffff').fontSize(10);
            doc.text('Producto', 45, tableY + 6, { width: colProductWidth });
            doc.text('Cantidad', 40 + colProductWidth, tableY + 6, { width: colQtyWidth, align: 'center' });
            doc.text('Precio Unit.', 40 + colProductWidth + colQtyWidth, tableY + 6, { width: colPriceWidth, align: 'right' });
            doc.text('Total', 40 + colProductWidth + colQtyWidth + colPriceWidth, tableY + 6, { width: colTotalWidth, align: 'right' });

            tableY += 22;
            doc.fillColor('#334155');

            // Listar ítems del pedido
            detalles.forEach((item, index) => {
                const totalItem = item.cantidad * parseFloat(item.precio_unitario);
                
                // Color alterno para filas
                if (index % 2 === 0) {
                    doc.rect(40, tableY, tableWidth, 20).fill('#f8fafc');
                } else {
                    doc.rect(40, tableY, tableWidth, 20).fill('#ffffff');
                }
                
                doc.fillColor('#334155');
                doc.text(item.producto_nombre, 45, tableY + 5, { width: colProductWidth, height: 12, ellipsis: true });
                doc.text(String(item.cantidad), 40 + colProductWidth, tableY + 5, { width: colQtyWidth, align: 'center' });
                doc.text(`₡${parseFloat(item.precio_unitario).toFixed(2)}`, 40 + colProductWidth + colQtyWidth, tableY + 5, { width: colPriceWidth, align: 'right' });
                doc.text(`₡${totalItem.toFixed(2)}`, 40 + colProductWidth + colQtyWidth + colPriceWidth, tableY + 5, { width: colTotalWidth, align: 'right' });

                tableY += 20;
            });

            // Línea antes de los totales
            doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, tableY).lineTo(550, tableY).stroke();
            tableY += 10;

            // 4. Totales de Facturación (derecha)
            const totalLabelX = 350;
            const totalValX = 450;

            doc.fillColor('#475569').fontSize(10);
            doc.text('Subtotal:', totalLabelX, tableY, { align: 'right', width: 90 });
            doc.fillColor('#1e293b').text(`₡${parseFloat(pedido.subtotal).toFixed(2)}`, totalValX, tableY, { align: 'right', width: 100 });
            
            tableY += 18;
            doc.fillColor('#475569');
            doc.text('IVA (13%):', totalLabelX, tableY, { align: 'right', width: 90 });
            doc.fillColor('#1e293b').text(`₡${parseFloat(pedido.iva).toFixed(2)}`, totalValX, tableY, { align: 'right', width: 100 });
            
            tableY += 18;
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(370, tableY - 4).lineTo(550, tableY - 4).stroke();
            doc.fontSize(12).fillColor('#2563eb');
            doc.text('Total:', totalLabelX, tableY, { align: 'right', width: 90 });
            doc.text(`₡${parseFloat(pedido.total).toFixed(2)}`, totalValX, tableY, { align: 'right', width: 100, fontWeight: 'bold' });

            // 5. Términos y Mensaje Final
            doc.moveDown(4);
            doc.fontSize(9).fillColor('#94a3b8').text('Gracias por preferir a VetExóticos, su clínica veterinaria de confianza para especies exóticas.', { align: 'center' });
            doc.text('Este documento sirve como comprobante de pago oficial y detalle de retiro para su pedido.', { align: 'center' });

            doc.end();

        } catch (error) {
            console.error('Error al generar la factura PDF:', error);
            res.status(500).send(`Error interno al generar la factura PDF: ${error.message}`);
        }
    }
}

module.exports = ReporteController;
