/**
 * Modelo de Cita
 * @description Maneja todas las operaciones CRUD para la entidad Cita
 */

const { pool } = require('../config/database');

class Cita {
    /**
     * Obtiene todas las citas con paginación
     */
    static async paginate(page = 1, limit = 10) {
        try {
            const pageInt = parseInt(page) || 1;
            const limitInt = parseInt(limit) || 10;
            const offset = (pageInt - 1) * limitInt;

            const [citas] = await pool.execute(
                `SELECT c.*, 
                        p.nombre as paciente_nombre,
                        pr.nombre as propietario_nombre,
                        pr.apellido as propietario_apellido
                 FROM citas c
                 JOIN pacientes p ON c.paciente_id = p.id
                 JOIN propietarios pr ON c.propietario_id = pr.id
                 ORDER BY c.fecha_cita DESC, c.hora_cita ASC
                 LIMIT ${limitInt} OFFSET ${offset}`
            );

            const total = await this.count();
            const totalPages = Math.ceil(total / limitInt);

            return {
                citas,
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
            console.error('Error en Cita.paginate:', error);
            throw new Error('Error al obtener citas');
        }
    }

    /**
     * Busca una cita por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.*, 
                        p.nombre as paciente_nombre,
                        pr.nombre as propietario_nombre,
                        pr.apellido as propietario_apellido,
                        pr.telefono as propietario_telefono
                 FROM citas c
                 JOIN pacientes p ON c.paciente_id = p.id
                 JOIN propietarios pr ON c.propietario_id = pr.id
                 WHERE c.id = ?`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Cita.findById:', error);
            throw new Error('Error al buscar cita');
        }
    }

    /**
     * Obtiene citas por propietario
     */
    static async findByPropietario(propietarioId) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.*, 
                        p.nombre as paciente_nombre
                 FROM citas c
                 JOIN pacientes p ON c.paciente_id = p.id
                 WHERE c.propietario_id = ?
                 ORDER BY c.fecha_cita DESC, c.hora_cita ASC`,
                [propietarioId]
            );
            return rows;
        } catch (error) {
            console.error('Error en Cita.findByPropietario:', error);
            throw new Error('Error al obtener citas del propietario');
        }
    }

    /**
     * Obtiene citas por paciente
     */
    static async findByPaciente(pacienteId) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM citas 
                 WHERE paciente_id = ?
                 ORDER BY fecha_cita DESC, hora_cita ASC`,
                [pacienteId]
            );
            return rows;
        } catch (error) {
            console.error('Error en Cita.findByPaciente:', error);
            throw new Error('Error al obtener citas del paciente');
        }
    }

    /**
     * Crea una nueva cita
     */
    static async create(data) {
        try {
            const {
                paciente_id,
                propietario_id,
                fecha_cita,
                hora_cita,
                motivo,
                estado,
                veterinario_asignado
            } = data;

            const [result] = await pool.execute(
                `INSERT INTO citas 
                 (paciente_id, propietario_id, fecha_cita, hora_cita, 
                  motivo, estado, veterinario_asignado)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [paciente_id, propietario_id, fecha_cita, hora_cita,
                 motivo, estado || 'pendiente', veterinario_asignado]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            console.error('Error en Cita.create:', error);
            throw new Error('Error al crear cita');
        }
    }

    /**
     * Actualiza una cita existente
     */
    static async update(id, data) {
        try {
            const {
                paciente_id,
                propietario_id,
                fecha_cita,
                hora_cita,
                motivo,
                estado,
                veterinario_asignado
            } = data;

            const [result] = await pool.execute(
                `UPDATE citas 
                 SET paciente_id = ?, propietario_id = ?, fecha_cita = ?, 
                     hora_cita = ?, motivo = ?, estado = ?, veterinario_asignado = ?
                 WHERE id = ?`,
                [paciente_id, propietario_id, fecha_cita, hora_cita,
                 motivo, estado, veterinario_asignado, id]
            );

            if (result.affectedRows === 0) {
                return null;
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error en Cita.update:', error);
            throw new Error('Error al actualizar cita');
        }
    }

    /**
     * Actualiza el estado de una cita
     */
    static async updateEstado(id, estado) {
        try {
            const [result] = await pool.execute(
                'UPDATE citas SET estado = ? WHERE id = ?',
                [estado, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Cita.updateEstado:', error);
            throw new Error('Error al actualizar estado de la cita');
        }
    }

    /**
     * Elimina una cita
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM citas WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Cita.delete:', error);
            throw new Error('Error al eliminar cita');
        }
    }

    /**
     * Busca citas por término (paciente o propietario)
     */
    static async search(termino) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.*, 
                        p.nombre as paciente_nombre,
                        pr.nombre as propietario_nombre,
                        pr.apellido as propietario_apellido
                 FROM citas c
                 JOIN pacientes p ON c.paciente_id = p.id
                 JOIN propietarios pr ON c.propietario_id = pr.id
                 WHERE p.nombre LIKE ? 
                 OR pr.nombre LIKE ? 
                 OR pr.apellido LIKE ?
                 ORDER BY c.fecha_cita DESC`,
                [`%${termino}%`, `%${termino}%`, `%${termino}%`]
            );
            return rows;
        } catch (error) {
            console.error('Error en Cita.search:', error);
            throw new Error('Error al buscar citas');
        }
    }

    /**
     * Obtiene solo fechas y horas de citas activas
     */
    static async getOcupadas() {
        try {
            const [rows] = await pool.execute(
                `SELECT fecha_cita, hora_cita FROM citas WHERE estado != 'cancelada'`
            );
            return rows;
        } catch (error) {
            console.error('Error en Cita.getOcupadas:', error);
            throw new Error('Error al obtener citas ocupadas');
        }
    }

    /**
     * Cuenta el total de citas
     */
    static async count() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as total FROM citas');
            return rows[0].total;
        } catch (error) {
            console.error('Error en Cita.count:', error);
            throw new Error('Error al contar citas');
        }
    }
}

module.exports = Cita;