/**
 * Modelo de Usuario
 * @description Maneja todas las operaciones CRUD para la entidad Usuario
 */

const { pool } = require('../config/database');

class Usuario {
    /**
     * Busca un usuario por su email (para autenticación)
     * @param {string} email - Email del usuario
     * @returns {Promise<Object|null>} Usuario encontrado o null
     */
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM usuarios WHERE email = ?',
                [email]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Usuario.findByEmail:', error);
            throw new Error('Error al buscar usuario por email');
        }
    }

    /**
     * Busca un usuario por su ID
     * @param {number} id - ID del usuario
     * @returns {Promise<Object|null>} Usuario encontrado o null
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT id, nombre, email, telefono, rol, fecha_creacion, fecha_actualizacion 
                 FROM usuarios WHERE id = ?`,
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Usuario.findById:', error);
            throw new Error('Error al buscar usuario por ID');
        }
    }

    /**
     * Crea un nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>} Usuario creado
     */
    static async create(userData) {
        try {
            const { nombre, email, password, telefono, rol = 'cliente' } = userData;
            
            const [result] = await pool.execute(
                `INSERT INTO usuarios (nombre, email, password, telefono, rol) 
                 VALUES (?, ?, ?, ?, ?)`,
                [nombre, email, password, telefono, rol]
            );

            const newUser = await this.findById(result.insertId);
            return newUser;
        } catch (error) {
            console.error('Error en Usuario.create:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El email ya está registrado');
            }
            throw new Error('Error al crear usuario');
        }
    }

    /**
     * Actualiza un usuario existente
     * @param {number} id - ID del usuario
     * @param {Object} userData - Datos a actualizar
     * @returns {Promise<Object|null>} Usuario actualizado o null
     */
    static async update(id, userData) {
        try {
            const { nombre, email, telefono } = userData;
            
            const [result] = await pool.execute(
                `UPDATE usuarios 
                 SET nombre = ?, email = ?, telefono = ?
                 WHERE id = ?`,
                [nombre, email, telefono, id]
            );

            if (result.affectedRows === 0) {
                return null;
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error en Usuario.update:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El email ya está registrado en otro usuario');
            }
            throw new Error('Error al actualizar usuario');
        }
    }

    /**
     * Actualiza la contraseña de un usuario
     * @param {number} id - ID del usuario
     * @param {string} hashedPassword - Contraseña hasheada
     * @returns {Promise<boolean>} True si se actualizó
     */
    static async updatePassword(id, hashedPassword) {
        try {
            const [result] = await pool.execute(
                'UPDATE usuarios SET password = ? WHERE id = ?',
                [hashedPassword, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Usuario.updatePassword:', error);
            throw new Error('Error al actualizar contraseña');
        }
    }

    /**
     * Obtiene todos los usuarios con rol 'admin' (veterinarios)
     * @returns {Promise<Array>} Listado de administradores
     */
    static async findAllAdmins() {
        try {
            const [rows] = await pool.execute(
                "SELECT id, nombre, email, telefono, rol FROM usuarios WHERE rol = 'admin'"
            );
            return rows;
        } catch (error) {
            console.error('Error en Usuario.findAllAdmins:', error);
            throw new Error('Error al obtener administradores');
        }
    }

    /**
     * Obtiene todos los usuarios registrados
     * @returns {Promise<Array>} Listado de todos los usuarios
     */
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                "SELECT id, nombre, email, telefono, rol, fecha_creacion FROM usuarios ORDER BY nombre ASC"
            );
            return rows;
        } catch (error) {
            console.error('Error en Usuario.findAll:', error);
            throw new Error('Error al obtener todos los usuarios');
        }
    }

    /**
     * Elimina un usuario por ID
     * @param {number} id - ID del usuario a eliminar
     * @returns {Promise<boolean>} True si se eliminó
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM usuarios WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Usuario.delete:', error);
            throw error;
        }
    }
}

module.exports = Usuario;