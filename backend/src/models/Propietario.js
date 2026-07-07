/**
 * Modelo de Propietario
 * @description Maneja todas las operaciones CRUD para la entidad Propietario
 */

const { pool } = require('../config/database');

class Propietario {
    /**
     * Obtiene todos los propietarios con paginación
     */
    static async paginate(page = 1, limit = 10) {
        try {
            const pageInt = parseInt(page) || 1;
            const limitInt = parseInt(limit) || 10;
            const offset = (pageInt - 1) * limitInt;

            const [propietarios] = await pool.execute(
                `SELECT * FROM propietarios 
                 WHERE id IN (SELECT DISTINCT propietario_id FROM pacientes)
                 ORDER BY nombre ASC LIMIT ${limitInt} OFFSET ${offset}`
            );

            const total = await this.count();
            const totalPages = Math.ceil(total / limitInt);

            return {
                propietarios,
                pagination: {
                    currentPage: pageInt,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limitInt,
                    hasNextPage: pageInt < totalPages,
                    hasPrevPage: pageInt > 1
                }
            };
        } catch (error) {
            console.error('Error en Propietario.paginate:', error);
            throw new Error('Error al obtener propietarios');
        }
    }

    /**
     * Busca un propietario por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM propietarios WHERE id = ?',
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Propietario.findById:', error);
            throw new Error('Error al buscar propietario');
        }
    }

    /**
     * Busca propietario por cédula
     */
    static async findByCedula(cedula) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM propietarios WHERE cedula = ?',
                [cedula]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Propietario.findByCedula:', error);
            throw new Error('Error al buscar propietario por cédula');
        }
    }

    /**
     * Busca propietario por usuario_id
     */
    static async findByUsuarioId(usuarioId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM propietarios WHERE usuario_id = ?',
                [usuarioId]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Propietario.findByUsuarioId:', error);
            throw new Error('Error al buscar propietario por usuario');
        }
    }

    /**
     * Crea un nuevo propietario
     */
    static async create(data) {
        try {
            const { usuario_id, nombre, apellido, cedula, telefono, email } = data;

            const [result] = await pool.execute(
                `INSERT INTO propietarios (usuario_id, nombre, apellido, cedula, telefono, email) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [usuario_id || null, nombre, apellido, cedula, telefono || 'N/A', email]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            console.error('Error en Propietario.create:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('La cédula ya está registrada');
            }
            throw new Error('Error al crear propietario');
        }
    }

    /**
     * Actualiza un propietario existente
     */
    static async update(id, data) {
        try {
            const { usuario_id, nombre, apellido, cedula, telefono, email } = data;

            const [result] = await pool.execute(
                `UPDATE propietarios 
                 SET usuario_id = ?, nombre = ?, apellido = ?, cedula = ?, telefono = ?, email = ?
                 WHERE id = ?`,
                [usuario_id || null, nombre, apellido, cedula, telefono || 'N/A', email, id]
            );

            if (result.affectedRows === 0) {
                return null;
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error en Propietario.update:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('La cédula ya está registrada en otro propietario');
            }
            throw new Error('Error al actualizar propietario');
        }
    }

    /**
     * Elimina un propietario
     */
    static async delete(id) {
        try {
            // Verificar si tiene pacientes asociados
            const [pacientes] = await pool.execute(
                'SELECT COUNT(*) as total FROM pacientes WHERE propietario_id = ?',
                [id]
            );

            if (pacientes[0].total > 0) {
                throw new Error('No se puede eliminar el propietario porque tiene pacientes asociados');
            }

            const [result] = await pool.execute(
                'DELETE FROM propietarios WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Propietario.delete:', error);
            throw error;
        }
    }

    /**
     * Busca propietarios por nombre o cédula
     */
    static async search(termino) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM propietarios 
                 WHERE id IN (SELECT DISTINCT propietario_id FROM pacientes)
                 AND (nombre LIKE ? 
                 OR apellido LIKE ? 
                 OR cedula LIKE ? 
                 OR email LIKE ?)
                 ORDER BY nombre ASC`,
                [`%${termino}%`, `%${termino}%`, `%${termino}%`, `%${termino}%`]
            );
            return rows;
        } catch (error) {
            console.error('Error en Propietario.search:', error);
            throw new Error('Error al buscar propietarios');
        }
    }

    /**
     * Cuenta el total de propietarios
     */
    static async count() {
        try {
            const [rows] = await pool.execute(
                'SELECT COUNT(DISTINCT propietario_id) as total FROM pacientes'
            );
            return rows[0].total;
        } catch (error) {
            console.error('Error en Propietario.count:', error);
            throw new Error('Error al contar propietarios');
        }
    }
}

module.exports = Propietario;