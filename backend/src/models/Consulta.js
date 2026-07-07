/**
 * Modelo de Consulta
 * @description Maneja todas las operaciones CRUD para la entidad Consulta
 */

const { pool } = require('../config/database');

class Consulta {
    /**
     * Obtiene todas las consultas con paginación
     */
    static async paginate(page = 1, limit = 10) {
        try {
            const pageInt = parseInt(page) || 1;
            const limitInt = parseInt(limit) || 10;
            const offset = (pageInt - 1) * limitInt;

            const [consultas] = await pool.execute(
                `SELECT c.*, 
                        p.nombre as paciente_nombre,
                        pr.nombre as propietario_nombre,
                        pr.apellido as propietario_apellido
                 FROM consultas c
                 JOIN expedientes e ON c.expediente_id = e.id
                 JOIN pacientes p ON e.paciente_id = p.id
                 JOIN propietarios pr ON p.propietario_id = pr.id
                 ORDER BY c.fecha DESC
                 LIMIT ${limitInt} OFFSET ${offset}`
            );

            const total = await this.count();
            const totalPages = Math.ceil(total / limitInt);

            return {
                consultas,
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
            console.error('Error en Consulta.paginate:', error);
            throw new Error('Error al obtener consultas');
        }
    }

    /**
     * Busca una consulta por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.*, 
                        p.nombre as paciente_nombre,
                        pr.nombre as propietario_nombre,
                        pr.apellido as propietario_apellido
                 FROM consultas c
                 JOIN expedientes e ON c.expediente_id = e.id
                 JOIN pacientes p ON e.paciente_id = p.id
                 JOIN propietarios pr ON p.propietario_id = pr.id
                 WHERE c.id = ?`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Consulta.findById:', error);
            throw new Error('Error al buscar consulta');
        }
    }

    /**
     * Obtiene consultas por expediente
     */
    static async findByExpediente(expedienteId) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM consultas 
                 WHERE expediente_id = ?
                 ORDER BY fecha DESC`,
                [expedienteId]
            );
            return rows;
        } catch (error) {
            console.error('Error en Consulta.findByExpediente:', error);
            throw new Error('Error al obtener consultas del expediente');
        }
    }

    /**
     * Obtiene consultas por paciente
     */
    static async findByPaciente(pacienteId) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.* 
                 FROM consultas c
                 JOIN expedientes e ON c.expediente_id = e.id
                 WHERE e.paciente_id = ?
                 ORDER BY c.fecha DESC`,
                [pacienteId]
            );
            return rows;
        } catch (error) {
            console.error('Error en Consulta.findByPaciente:', error);
            throw new Error('Error al obtener consultas del paciente');
        }
    }

    /**
     * Crea una nueva consulta
     */
    static async create(data) {
        try {
            const {
                expediente_id,
                fecha,
                motivo,
                sintomas,
                observaciones,
                veterinario,
                peso_registrado,
                temperatura
            } = data;

            const [result] = await pool.execute(
                `INSERT INTO consultas 
                 (expediente_id, fecha, motivo, sintomas, observaciones, 
                  veterinario, peso_registrado, temperatura)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [expediente_id, fecha, motivo, sintomas, observaciones,
                 veterinario, peso_registrado, temperatura]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            console.error('Error en Consulta.create:', error);
            throw new Error('Error al crear consulta');
        }
    }

    /**
     * Actualiza una consulta existente
     */
    static async update(id, data) {
        try {
            const {
                fecha,
                motivo,
                sintomas,
                observaciones,
                veterinario,
                peso_registrado,
                temperatura
            } = data;

            const [result] = await pool.execute(
                `UPDATE consultas 
                 SET fecha = ?, motivo = ?, sintomas = ?, observaciones = ?, 
                     veterinario = ?, peso_registrado = ?, temperatura = ?
                 WHERE id = ?`,
                [fecha, motivo, sintomas, observaciones,
                 veterinario, peso_registrado, temperatura, id]
            );

            if (result.affectedRows === 0) {
                return null;
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error en Consulta.update:', error);
            throw new Error('Error al actualizar consulta');
        }
    }

    /**
     * Elimina una consulta
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM consultas WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Consulta.delete:', error);
            throw new Error('Error al eliminar consulta');
        }
    }

    /**
     * Busca consultas por término (motivo, diagnóstico, observaciones)
     */
    static async search(termino) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.*, 
                        p.nombre as paciente_nombre,
                        pr.nombre as propietario_nombre,
                        pr.apellido as propietario_apellido
                 FROM consultas c
                 JOIN expedientes e ON c.expediente_id = e.id
                 JOIN pacientes p ON e.paciente_id = p.id
                 JOIN propietarios pr ON p.propietario_id = pr.id
                 WHERE c.motivo LIKE ? 
                 OR c.observaciones LIKE ?
                 ORDER BY c.fecha DESC`,
                [`%${termino}%`, `%${termino}%`]
            );
            return rows;
        } catch (error) {
            console.error('Error en Consulta.search:', error);
            throw new Error('Error al buscar consultas');
        }
    }

    /**
     * Cuenta el total de consultas
     */
    static async count() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as total FROM consultas');
            return rows[0].total;
        } catch (error) {
            console.error('Error en Consulta.count:', error);
            throw new Error('Error al contar consultas');
        }
    }
}

module.exports = Consulta;