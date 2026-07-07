/**
 * Modelo de Expediente
 * @description Maneja todas las operaciones CRUD para la entidad Expediente
 */

const { pool } = require('../config/database');

class Expediente {
    /**
     * Obtiene un expediente por ID de paciente
     */
    static async findByPacienteId(pacienteId) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM expedientes WHERE paciente_id = ? AND fecha_cierre IS NULL`,
                [pacienteId]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Expediente.findByPacienteId:', error);
            throw new Error('Error al buscar expediente');
        }
    }

    /**
     * Obtiene un expediente por ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM expedientes WHERE id = ?`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Expediente.findById:', error);
            throw new Error('Error al buscar expediente');
        }
    }

    /**
     * Crea un nuevo expediente
     */
    static async create(data) {
        try {
            const { 
                paciente_id, 
                fecha_apertura, 
                notas_generales, 
                alergias, 
                enfermedades_cronicas, 
                vacunas 
            } = data;

            const [result] = await pool.execute(
                `INSERT INTO expedientes 
                 (paciente_id, fecha_apertura, notas_generales, alergias, 
                  enfermedades_cronicas, vacunas) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    paciente_id, 
                    fecha_apertura, 
                    notas_generales || null, 
                    alergias || null, 
                    enfermedades_cronicas || null, 
                    vacunas || null
                ]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            console.error('Error en Expediente.create:', error);
            throw new Error('Error al crear expediente');
        }
    }

    /**
     * Actualiza un expediente existente
     */
    static async update(id, data) {
        try {
            const { 
                fecha_apertura, 
                fecha_cierre, 
                notas_generales, 
                alergias, 
                enfermedades_cronicas, 
                vacunas 
            } = data;

            const [result] = await pool.execute(
                `UPDATE expedientes 
                 SET fecha_apertura = ?, fecha_cierre = ?, notas_generales = ?, 
                     alergias = ?, enfermedades_cronicas = ?, vacunas = ?
                 WHERE id = ?`,
                [
                    fecha_apertura, 
                    fecha_cierre || null, 
                    notas_generales || null, 
                    alergias || null, 
                    enfermedades_cronicas || null, 
                    vacunas || null, 
                    id
                ]
            );

            if (result.affectedRows === 0) {
                return null;
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error en Expediente.update:', error);
            throw new Error('Error al actualizar expediente');
        }
    }

    /**
     * Cierra un expediente
     */
    static async cerrar(id, fecha_cierre) {
        try {
            const [result] = await pool.execute(
                'UPDATE expedientes SET fecha_cierre = ? WHERE id = ?',
                [fecha_cierre, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Expediente.cerrar:', error);
            throw new Error('Error al cerrar expediente');
        }
    }

    /**
     * Elimina un expediente por ID
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM expedientes WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Expediente.delete:', error);
            throw new Error('Error al eliminar expediente');
        }
    }
}

module.exports = Expediente;