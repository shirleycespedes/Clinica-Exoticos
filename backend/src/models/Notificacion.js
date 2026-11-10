/**
 * Modelo de Notificaciones
 * @description Maneja las notificaciones del sistema almacenadas en base de datos
 */

const { pool } = require('../config/database');

class Notificacion {
    /**
     * Crea un nuevo registro de notificación
     */
    static async create({ usuario_id, titulo, mensaje, tipo, data = {} }) {
        try {
            const [result] = await pool.execute(
                `INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, data)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    usuario_id,
                    titulo,
                    mensaje,
                    tipo,
                    typeof data === 'string' ? data : JSON.stringify(data)
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear notificación en BD:', error);
            return null;
        }
    }

    /**
     * Obtiene las notificaciones más recientes de un usuario
     */
    static async findByUsuario(usuario_id, limit = 30) {
        try {
            const [rows] = await pool.query(
                `SELECT id, usuario_id, titulo, mensaje, tipo, leida, data, created_at
                 FROM notificaciones
                 WHERE usuario_id = ?
                 ORDER BY created_at DESC
                 LIMIT ?`,
                [usuario_id, Number(limit)]
            );
            return rows.map(r => ({
                ...r,
                data: typeof r.data === 'string' ? JSON.parse(r.data || '{}') : (r.data || {})
            }));
        } catch (error) {
            console.error('Error al consultar notificaciones por usuario:', error);
            return [];
        }
    }

    /**
     * Cuenta cuántas notificaciones no leídas tiene un usuario
     */
    static async countUnread(usuario_id) {
        try {
            const [rows] = await pool.execute(
                `SELECT COUNT(*) as unread FROM notificaciones WHERE usuario_id = ? AND leida = 0`,
                [usuario_id]
            );
            return rows[0]?.unread || 0;
        } catch (error) {
            console.error('Error al contar no leídas:', error);
            return 0;
        }
    }

    /**
     * Marca una notificación como leída
     */
    static async markAsRead(id, usuario_id) {
        try {
            await pool.execute(
                `UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?`,
                [id, usuario_id]
            );
            return true;
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            return false;
        }
    }

    /**
     * Marca todas las notificaciones de un usuario como leídas
     */
    static async markAllAsRead(usuario_id) {
        try {
            await pool.execute(
                `UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?`,
                [usuario_id]
            );
            return true;
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
            return false;
        }
    }
}

module.exports = Notificacion;

