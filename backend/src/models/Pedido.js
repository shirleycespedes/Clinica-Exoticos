/**
 * Modelo de Pedido
 * @description Maneja las operaciones de base de datos para la tabla de pedidos y detalles de pedido
 */

const { pool } = require('../config/database');

class Pedido {
    /**
     * Crea un nuevo pedido con sus detalles en una transacción
     */
    static async create(data) {
        const { usuario_id, items, codigo_retiro, metodo_pago, comprobante_pago } = data;
        
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            let calculatedSubtotal = 0;
            let calculatedIva = 0;

            // 1. Validar stock de todos los productos y acumular precios + IVA de la BD
            for (const item of items) {
                const [productRows] = await connection.query(
                    'SELECT stock, nombre, precio, iva FROM productos WHERE id = ? FOR UPDATE',
                    [item.producto_id]
                );
                
                const product = productRows[0];
                if (!product) {
                    throw new Error(`El producto con ID ${item.producto_id} no existe.`);
                }
                
                if (product.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}, Solicitado: ${item.cantidad}`);
                }

                const itemPrecio = parseFloat(product.precio);
                const itemIvaPorcentaje = parseInt(product.iva !== null && product.iva !== undefined ? product.iva : 13);
                const itemSubtotal = itemPrecio * item.cantidad;
                const itemIva = itemSubtotal * (itemIvaPorcentaje / 100);

                calculatedSubtotal += itemSubtotal;
                calculatedIva += itemIva;

                // Guardar para inserción posterior en detalles_pedido
                item.precio_unitario = itemPrecio;
            }

            const calculatedTotal = calculatedSubtotal + calculatedIva;

            const initialEstado = 'pendiente';

            // 2. Insertar cabecera del pedido (vincular usuario_id y usuarios_id para soportar ambas llaves)
            const [orderResult] = await connection.query(
                `INSERT INTO pedidos (usuario_id, usuarios_id, subtotal, iva, total, codigo_retiro, estado, metodo_pago, comprobante_pago) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [usuario_id, usuario_id, calculatedSubtotal, calculatedIva, calculatedTotal, codigo_retiro, initialEstado, metodo_pago || 'efectivo', comprobante_pago || null]
            );
            
            const pedidoId = orderResult.insertId;

            // 3. Insertar detalles del pedido, restar stock y registrar salida de inventario
            for (const item of items) {
                // Restar stock
                const [stockResult] = await connection.query(
                    'UPDATE productos SET stock = stock - ? WHERE id = ?',
                    [item.cantidad, item.producto_id]
                );

                if (stockResult.affectedRows === 0) {
                    throw new Error('No se pudo actualizar el stock.');
                }

                // Registrar movimiento de inventario de tipo 'salida'
                await connection.query(
                    `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id) 
                     VALUES (?, 'salida', ?, ?, ?)`,
                    [item.producto_id, item.cantidad, `Compra en tienda - Pedido ${codigo_retiro}`, usuario_id]
                );

                // Insertar fila en detalles_pedido (pedido_id y pedidos_id, producto_id y productos_id)
                await connection.query(
                    `INSERT INTO detalles_pedido (pedido_id, pedidos_id, producto_id, productos_id, cantidad, precio_unitario) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [pedidoId, pedidoId, item.producto_id, item.producto_id, item.cantidad, item.precio_unitario]
                );
            }

            await connection.commit();
            
            // Retornar el pedido creado
            const [newOrderRows] = await pool.query(
                'SELECT * FROM pedidos WHERE id = ?',
                [pedidoId]
            );
            return newOrderRows[0];

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error en transacción de Pedido.create:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Busca un pedido por su ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM pedidos WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error en Pedido.findById:', error);
            throw new Error('Error al buscar el pedido');
        }
    }

    /**
     * Obtiene todos los pedidos del sistema (solo Admin)
     */
    static async findAllAdmin() {
        try {
            const [rows] = await pool.execute(
                `SELECT p.*, u.nombre as usuario_nombre, u.email as usuario_email 
                 FROM pedidos p
                 JOIN usuarios u ON p.usuario_id = u.id OR p.usuarios_id = u.id
                 ORDER BY p.fecha_pedido DESC`
            );
            return rows;
        } catch (error) {
            console.error('Error en Pedido.findAllAdmin:', error);
            throw new Error('Error al obtener pedidos globales');
        }
    }

    /**
     * Obtiene los pedidos de un usuario específico
     */
    static async findByUsuarioId(userId) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM pedidos 
                 WHERE usuario_id = ? OR usuarios_id = ?
                 ORDER BY fecha_pedido DESC`,
                [userId, userId]
            );
            return rows;
        } catch (error) {
            console.error('Error en Pedido.findByUsuarioId:', error);
            throw new Error('Error al obtener tus pedidos');
        }
    }

    /**
     * Obtiene el desglose de productos de un pedido
     */
    static async findDetailsByPedidoId(pedidoId) {
        try {
            const [rows] = await pool.execute(
                `SELECT dp.*, prod.nombre as producto_nombre, prod.descripcion as producto_descripcion 
                 FROM detalles_pedido dp
                 JOIN productos prod ON dp.producto_id = prod.id OR dp.productos_id = prod.id
                 WHERE dp.pedido_id = ? OR dp.pedidos_id = ?`,
                [pedidoId, pedidoId]
            );
            return rows;
        } catch (error) {
            console.error('Error en Pedido.findDetailsByPedidoId:', error);
            throw new Error('Error al obtener los detalles del pedido');
        }
    }

    /**
     * Cancela un pedido por parte del cliente (solo si está pendiente) y restaura el stock
     */
    static async cancelByClient(pedidoId, userId) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Obtener y bloquear el pedido, validando pertenencia y estado
            const [orderRows] = await connection.query(
                `SELECT * FROM pedidos 
                 WHERE id = ? AND (usuario_id = ? OR usuarios_id = ?) 
                 FOR UPDATE`,
                [pedidoId, userId, userId]
            );

            const order = orderRows[0];
            if (!order) {
                throw new Error('Pedido no encontrado o no pertenece a su cuenta.');
            }

            if (order.estado !== 'pendiente') {
                throw new Error(`No se puede cancelar un pedido con estado "${order.estado}". Solo se cancelan pendientes.`);
            }

            // 2. Cambiar estado a cancelado
            await connection.query(
                "UPDATE pedidos SET estado = 'cancelado' WHERE id = ?",
                [pedidoId]
            );

            // 3. Obtener detalles y devolver el stock
            const [detailRows] = await connection.query(
                "SELECT * FROM detalles_pedido WHERE pedido_id = ? OR pedidos_id = ?",
                [pedidoId, pedidoId]
            );

            for (const item of detailRows) {
                const prodId = item.producto_id || item.productos_id;
                await connection.query(
                    "UPDATE productos SET stock = stock + ? WHERE id = ?",
                    [item.cantidad, prodId]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error en Pedido.cancelByClient:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Actualiza el estado de un pedido (ej: marcar como retirado, listo, cancelado)
     */
    static async updateEstado(id, estado) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // 1. Obtener la cabecera del pedido
            const [orderRows] = await connection.query(
                'SELECT codigo_retiro, estado FROM pedidos WHERE id = ? FOR UPDATE',
                [id]
            );
            const order = orderRows[0];
            if (!order) {
                throw new Error('Pedido no encontrado.');
            }

            const oldEstado = order.estado;

            // 2. Actualizar el estado del pedido
            const [result] = await connection.query(
                'UPDATE pedidos SET estado = ? WHERE id = ?',
                [estado, id]
            );

            // 3. Si pasa a retirado o pagado, actualizar los motivos y la fecha de los movimientos de inventario asociados
            if (estado === 'retirado' || estado === 'pagado') {
                const oldMotivo1 = `Compra en tienda - Pedido ${order.codigo_retiro}`;
                const oldMotivo2 = `Entregado en tienda - Pedido ${order.codigo_retiro}`;
                const newMotivo = `Pedido Completado y Pagado - ${order.codigo_retiro}`;
                await connection.query(
                    `UPDATE movimientos_inventario 
                     SET motivo = ?, fecha = CURRENT_TIMESTAMP 
                     WHERE motivo = ? OR motivo = ?`,
                    [newMotivo, oldMotivo1, oldMotivo2]
                );
            }

            // 4. Si pasa a cancelado y antes no lo estaba, devolver el stock y registrar movimientos de entrada o reversión
            if (estado === 'cancelado' && oldEstado !== 'cancelado') {
                const [detailRows] = await connection.query(
                    "SELECT * FROM detalles_pedido WHERE pedido_id = ? OR pedidos_id = ?",
                    [id, id]
                );

                for (const item of detailRows) {
                    const prodId = item.producto_id || item.productos_id;
                    
                    // Devolver stock
                    await connection.query(
                        "UPDATE productos SET stock = stock + ? WHERE id = ?",
                        [item.cantidad, prodId]
                    );

                    // Registrar movimiento de entrada por devolución
                    await connection.query(
                        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id) 
                         VALUES (?, 'entrada', ?, ?, ?)`,
                        [prodId, item.cantidad, `Devolución por cancelación - Pedido ${order.codigo_retiro}`, 1] // Usar ID de administrador por defecto
                    );
                }
            }

            // 5. Si antes estaba cancelado y pasa a otro estado (por ejemplo, pendiente o listo), volver a descontar el stock y registrar salida
            if (oldEstado === 'cancelado' && estado !== 'cancelado') {
                const [detailRows] = await connection.query(
                    "SELECT * FROM detalles_pedido WHERE pedido_id = ? OR pedidos_id = ?",
                    [id, id]
                );

                for (const item of detailRows) {
                    const prodId = item.producto_id || item.productos_id;
                    
                    // Descontar stock
                    await connection.query(
                        "UPDATE productos SET stock = stock - ? WHERE id = ?",
                        [item.cantidad, prodId]
                    );

                    // Registrar salida de nuevo
                    await connection.query(
                        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, motivo, usuario_id) 
                         VALUES (?, 'salida', ?, ?, ?)`,
                        [prodId, item.cantidad, `Compra en tienda - Pedido ${order.codigo_retiro}`, 1]
                    );
                }
            }

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error en Pedido.updateEstado:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = Pedido;
