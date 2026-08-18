/**
 * Middleware de Validación
 * @description Contiene todas las validaciones para las rutas
 */

const { body, param } = require('express-validator');

// ============================================
// VALIDACIONES DE USUARIOS
// ============================================

/**
 * Validaciones para registro de usuario
 */
const validateRegister = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),

    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail()
        .isLength({ max: 100 }).withMessage('El email no puede exceder 100 caracteres'),

    body('password')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-\/#])/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&._-/#)'),

    body('telefono')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[\+]?[0-9\-\(\)\s]{7,20}$/).withMessage('Formato de teléfono inválido'),

    body('cedula')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 5, max: 20 }).withMessage('La cédula debe tener entre 5 y 20 caracteres')
        .matches(/^[0-9-]+$/).withMessage('La cédula solo debe contener números y guiones')
];

/**
 * Validaciones para login
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
];

/**
 * Validaciones para recuperación de contraseña (solicitud)
 */
const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail()
];

/**
 * Validaciones para restablecimiento de contraseña (confirmación)
 */
const validateResetPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('code')
        .trim()
        .notEmpty().withMessage('El código de recuperación es requerido')
        .isLength({ min: 6, max: 6 }).withMessage('El código debe tener exactamente 6 dígitos')
        .isNumeric().withMessage('El código debe ser numérico'),

    body('newPassword')
        .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
];

// ============================================
// VALIDACIONES DE PROPIETARIOS
// ============================================

const validatePropietario = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),

    body('apellido')
        .trim()
        .notEmpty().withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/).withMessage('El apellido solo puede contener letras y espacios'),

    body('cedula')
        .trim()
        .notEmpty().withMessage('La cédula es requerida')
        .isLength({ min: 5, max: 20 }).withMessage('La cédula debe tener entre 5 y 20 caracteres')
        .matches(/^[0-9-]+$/).withMessage('La cédula solo debe contener números y guiones'),

    body('telefono')
        .optional()
        .trim()
        .matches(/^[\+]?[0-9\-\(\)\s]{7,20}$/).withMessage('Formato de teléfono inválido'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Debe ser un email válido')
];

// ============================================
// VALIDACIONES DE PACIENTES
// ============================================

const validatePaciente = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

    body('especie')
        .trim()
        .notEmpty().withMessage('La especie es requerida')
        .isLength({ min: 2, max: 100 }).withMessage('La especie debe tener entre 2 y 100 caracteres'),

    body('tipo_animal')
        .notEmpty().withMessage('El tipo de animal es requerido')
        .isIn(['Reptil', 'Ave', 'Anfibio', 'Mamifero_Exotico', 'Aracnido', 'Otro'])
        .withMessage('Tipo de animal inválido'),

    body('habitat')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('El hábitat no debe exceder 50 caracteres'),

    body('dieta')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 255 }).withMessage('La dieta no debe exceder 255 caracteres'),

    body('fecha_nacimiento')
        .optional()
        .isDate().withMessage('Debe ser una fecha válida'),

    body('sexo')
        .optional()
        .isIn(['Macho', 'Hembra', 'Indeterminado'])
        .withMessage('Sexo inválido'),

    body('peso')
        .optional()
        .isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo'),

    body('microchip')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('El microchip no debe exceder 100 caracteres')
        .matches(/^[a-zA-Z0-9.\-\/\s]+$/).withMessage('El microchip solo puede contener letras, números, puntos, guiones y barras diagonales'),

    body('propietario_id')
        .notEmpty().withMessage('El propietario es requerido')
        .isInt().withMessage('El ID del propietario debe ser un número')
];

// ============================================
// VALIDACIONES DE CITAS
// ============================================

const validateCita = [
    body('paciente_id')
        .notEmpty().withMessage('El paciente es requerido')
        .isInt().withMessage('El ID del paciente debe ser un número'),

    body('propietario_id')
        .notEmpty().withMessage('El propietario es requerido')
        .isInt().withMessage('El ID del propietario debe ser un número'),

    body('fecha_cita')
        .notEmpty().withMessage('La fecha de la cita es requerida')
        .isDate().withMessage('Debe ser una fecha válida'),

    body('hora_cita')
        .notEmpty().withMessage('La hora de la cita es requerida')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido (HH:MM)'),

    body('motivo')
        .optional()
        .trim(),

    body('estado')
        .optional()
        .isIn(['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'])
        .withMessage('Estado inválido')
];

// ============================================
// VALIDACIONES DE CONSULTAS
// ============================================

const validateConsulta = [
    body('expediente_id')
        .notEmpty().withMessage('El expediente es requerido')
        .isInt().withMessage('El ID del expediente debe ser un número'),

    body('fecha')
        .notEmpty().withMessage('La fecha es requerida')
        .isDate().withMessage('Debe ser una fecha válida'),

    body('motivo')
        .optional()
        .trim(),

    body('sintomas')
        .optional()
        .trim(),

    body('observaciones')
        .optional()
        .trim(),

    body('veterinario')
        .notEmpty().withMessage('El veterinario es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El veterinario debe tener entre 2 y 100 caracteres'),

    body('peso_registrado')
        .optional()
        .isFloat({ min: 0 }).withMessage('El peso debe ser un número positivo'),

    body('temperatura')
        .optional()
        .isFloat({ min: 0 }).withMessage('La temperatura debe ser un número positivo')
];

// ============================================
// VALIDACIÓN DE ID
// ============================================

const validateId = [
    param('id')
        .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
];

// ============================================
// VALIDACIÓN DE EXPEDIENTE
// ============================================

const validateExpediente = [
    body('paciente_id')
        .notEmpty().withMessage('El paciente es requerido')
        .isInt().withMessage('El ID del paciente debe ser un número'),

    body('fecha_apertura')
        .notEmpty().withMessage('La fecha de apertura es requerida')
        .isDate().withMessage('Debe ser una fecha válida'),

    body('notas_generales')
        .optional()
        .trim(),

    body('alergias')
        .optional()
        .trim(),

    body('enfermedades_cronicas')
        .optional()
        .trim(),

    body('vacunas')
        .optional()
        .trim()
];

module.exports = {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validatePropietario,
    validatePaciente,
    validateCita,
    validateConsulta,
    validateExpediente,
    validateId
};