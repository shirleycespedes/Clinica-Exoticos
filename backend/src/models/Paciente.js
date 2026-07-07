/**
 * Modelo de Paciente
 * @description Maneja todas las operaciones CRUD para la entidad Paciente (animales exóticos)
 */

const { pool } = require('../config/database');

class Paciente {
    /**
     * Obtiene todos los pacientes con paginación
     */
    static async paginate(page = 1, limit = 10) {
        try {
            const pageInt = parseInt(page) || 1;
            const limitInt = parseInt(limit) || 10;
            const offset = (pageInt - 1) * limitInt;

            const [pacientes] = await pool.execute(
                `SELECT p.*, 
                        pr.nombre as propietario_nombre, 
                        pr.apellido as propietario_apellido,
                        pr.telefono as propietario_telefono,
                        pr.email as propietario_email,
                        pr.cedula as propietario_cedula,
                        e.id as expediente_id
                 FROM pacientes p
                 JOIN propietarios pr ON p.propietario_id = pr.id
                 LEFT JOIN expedientes e ON e.paciente_id = p.id AND e.fecha_cierre IS NULL
                 ORDER BY p.nombre ASC
                 LIMIT ${limitInt} OFFSET ${offset}`
            );

            const total = await this.count();
            const totalPages = Math.ceil(total / limitInt);

            return {
                pacientes,
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
            console.error('Error en Paciente.paginate:', error);
            throw new Error('Error al obtener pacientes');
        }
    }

    /**
     * Busca un paciente por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT p.*, 
                        pr.nombre as propietario_nombre, 
                        pr.apellido as propietario_apellido,
                        pr.telefono as propietario_telefono,
                        pr.email as propietario_email,
                        pr.cedula as propietario_cedula,
                        e.id as expediente_id
                 FROM pacientes p
                 JOIN propietarios pr ON p.propietario_id = pr.id
                 LEFT JOIN expedientes e ON e.paciente_id = p.id AND e.fecha_cierre IS NULL
                 WHERE p.id = ?`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Paciente.findById:', error);
            throw new Error('Error al buscar paciente');
        }
    }

    /**
     * Obtiene pacientes por propietario
     */
    static async findByPropietario(propietarioId) {
        try {
            const [rows] = await pool.execute(
                `SELECT p.*, 
                        pr.nombre as propietario_nombre, 
                        pr.apellido as propietario_apellido,
                        pr.telefono as propietario_telefono,
                        pr.email as propietario_email,
                        pr.cedula as propietario_cedula,
                        e.id as expediente_id
                 FROM pacientes p
                 JOIN propietarios pr ON p.propietario_id = pr.id
                 LEFT JOIN expedientes e ON e.paciente_id = p.id AND e.fecha_cierre IS NULL
                 WHERE p.propietario_id = ?
                 ORDER BY p.nombre ASC`,
                [propietarioId]
            );
            return rows;
        } catch (error) {
            console.error('Error en Paciente.findByPropietario:', error);
            throw new Error('Error al obtener pacientes del propietario');
        }
    }

    /**
     * Crea un nuevo paciente
     */
    static async create(data) {
        try {
            const {
                nombre, especie, tipo_animal, habitat, dieta,
                fecha_nacimiento, sexo, peso, microchip, propietario_id
            } = data;

            const [result] = await pool.execute(
                `INSERT INTO pacientes 
                 (nombre, especie, tipo_animal, habitat, dieta, 
                  fecha_nacimiento, sexo, peso, microchip, propietario_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    nombre, 
                    especie, 
                    tipo_animal, 
                    habitat === undefined ? null : habitat, 
                    dieta === undefined ? null : dieta,
                    fecha_nacimiento === undefined ? null : fecha_nacimiento, 
                    sexo === undefined ? null : sexo, 
                    peso === undefined ? null : peso, 
                    microchip === undefined ? null : microchip, 
                    propietario_id
                ]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            console.error('Error en Paciente.create:', error);
            throw new Error('Error al crear paciente');
        }
    }

    /**
     * Actualiza un paciente existente
     */
    static async update(id, data) {
        try {
            const {
                nombre, especie, tipo_animal, habitat, dieta,
                fecha_nacimiento, sexo, peso, microchip, propietario_id
            } = data;

            const [result] = await pool.execute(
                `UPDATE pacientes 
                 SET nombre = ?, especie = ?, tipo_animal = ?, habitat = ?, 
                     dieta = ?, fecha_nacimiento = ?, sexo = ?, peso = ?, 
                     microchip = ?, propietario_id = ?
                 WHERE id = ?`,
                [
                    nombre, 
                    especie, 
                    tipo_animal, 
                    habitat === undefined ? null : habitat, 
                    dieta === undefined ? null : dieta,
                    fecha_nacimiento === undefined ? null : fecha_nacimiento, 
                    sexo === undefined ? null : sexo, 
                    peso === undefined ? null : peso, 
                    microchip === undefined ? null : microchip, 
                    propietario_id, 
                    id
                ]
            );

            if (result.affectedRows === 0) {
                return null;
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error en Paciente.update:', error);
            throw new Error('Error al actualizar paciente');
        }
    }

    /**
     * Elimina un paciente
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM pacientes WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Paciente.delete:', error);
            throw new Error('Error al eliminar paciente');
        }
    }

    /**
     * Busca pacientes por nombre o especie
     */
    static async search(termino) {
        try {
            const [rows] = await pool.execute(
                `SELECT p.*, 
                        pr.nombre as propietario_nombre, 
                        pr.apellido as propietario_apellido,
                        pr.telefono as propietario_telefono,
                        pr.email as propietario_email,
                        pr.cedula as propietario_cedula,
                        e.id as expediente_id
                 FROM pacientes p
                 JOIN propietarios pr ON p.propietario_id = pr.id
                 LEFT JOIN expedientes e ON e.paciente_id = p.id AND e.fecha_cierre IS NULL
                 WHERE p.nombre LIKE ? 
                 OR p.especie LIKE ?
                 ORDER BY p.nombre ASC`,
                [`%${termino}%`, `%${termino}%`]
            );
            return rows;
        } catch (error) {
            console.error('Error en Paciente.search:', error);
            throw new Error('Error al buscar pacientes');
        }
    }

    /**
     * Cuenta el total de pacientes
     */
    static async count() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as total FROM pacientes');
            return rows[0].total;
        } catch (error) {
            console.error('Error en Paciente.count:', error);
            throw new Error('Error al contar pacientes');
        }
    }
}

module.exports = Paciente;