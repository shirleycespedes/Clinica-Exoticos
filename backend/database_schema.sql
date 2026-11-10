-- Clinica Exoticos Database Export
-- Generado para Despliegue en la Nube (Produccion)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `citas`;
CREATE TABLE `citas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `paciente_id` int NOT NULL,
  `propietario_id` int NOT NULL,
  `fecha_cita` date NOT NULL,
  `hora_cita` time NOT NULL,
  `motivo` text,
  `estado` enum('pendiente','confirmada','completada','cancelada','ausente') NOT NULL DEFAULT 'pendiente',
  `veterinario_asignado` varchar(100) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `paciente_id` (`paciente_id`),
  KEY `propietario_id` (`propietario_id`),
  CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`propietario_id`) REFERENCES `propietarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3;

INSERT INTO `citas` (`id`, `paciente_id`, `propietario_id`, `fecha_cita`, `hora_cita`, `motivo`, `estado`, `veterinario_asignado`, `fecha_creacion`, `fecha_actualizacion`) VALUES (1, 1, 1, '2026-07-02 06:00:00', '14:30:00', 'caida de piel', 'completada', 'Dr. Carlos Gómez', '2026-07-02 22:09:23', '2026-07-02 23:06:04');
INSERT INTO `citas` (`id`, `paciente_id`, `propietario_id`, `fecha_cita`, `hora_cita`, `motivo`, `estado`, `veterinario_asignado`, `fecha_creacion`, `fecha_actualizacion`) VALUES (2, 1, 1, '2026-07-15 06:00:00', '10:30:00', 'Revisión y corte de uñas', 'completada', 'Dr. Juan Carlos', '2026-07-02 22:11:34', '2026-07-02 22:26:31');
INSERT INTO `citas` (`id`, `paciente_id`, `propietario_id`, `fecha_cita`, `hora_cita`, `motivo`, `estado`, `veterinario_asignado`, `fecha_creacion`, `fecha_actualizacion`) VALUES (3, 1, 1, '2026-07-02 06:00:00', '12:00:00', 'se despelleja', 'confirmada', 'Por definir', '2026-07-02 22:12:29', '2026-07-02 23:06:44');
INSERT INTO `citas` (`id`, `paciente_id`, `propietario_id`, `fecha_cita`, `hora_cita`, `motivo`, `estado`, `veterinario_asignado`, `fecha_creacion`, `fecha_actualizacion`) VALUES (4, 1, 1, '2026-07-02 06:00:00', '09:00:00', 'color', 'cancelada', 'Por definir', '2026-07-02 23:15:16', '2026-07-07 19:04:21');
INSERT INTO `citas` (`id`, `paciente_id`, `propietario_id`, `fecha_cita`, `hora_cita`, `motivo`, `estado`, `veterinario_asignado`, `fecha_creacion`, `fecha_actualizacion`) VALUES (5, 4, 2, '2026-07-07 06:00:00', '06:00:00', 'Control', 'pendiente', 'Por definir', '2026-07-07 18:01:45', '2026-07-07 18:01:45');
INSERT INTO `citas` (`id`, `paciente_id`, `propietario_id`, `fecha_cita`, `hora_cita`, `motivo`, `estado`, `veterinario_asignado`, `fecha_creacion`, `fecha_actualizacion`) VALUES (6, 2, 1, '2026-07-07 06:00:00', '13:00:00', 'Ácaros', 'confirmada', 'Por definir', '2026-07-07 19:05:47', '2026-07-08 01:10:17');
INSERT INTO `citas` (`id`, `paciente_id`, `propietario_id`, `fecha_cita`, `hora_cita`, `motivo`, `estado`, `veterinario_asignado`, `fecha_creacion`, `fecha_actualizacion`) VALUES (7, 9, 1, '2026-07-28 06:00:00', '06:00:00', 'control', 'confirmada', 'Dr. Oscar reyes', '2026-07-29 00:43:01', '2026-11-10 03:56:15');
INSERT INTO `citas` (`id`, `paciente_id`, `propietario_id`, `fecha_cita`, `hora_cita`, `motivo`, `estado`, `veterinario_asignado`, `fecha_creacion`, `fecha_actualizacion`) VALUES (8, 9, 1, '2026-07-28 06:00:00', '06:00:00', 'consulta', 'completada', 'Dr. Oscar reyes', '2026-07-29 00:44:32', '2026-07-29 00:57:50');
INSERT INTO `citas` (`id`, `paciente_id`, `propietario_id`, `fecha_cita`, `hora_cita`, `motivo`, `estado`, `veterinario_asignado`, `fecha_creacion`, `fecha_actualizacion`) VALUES (9, 9, 1, '2026-01-28 06:00:00', '10:00:00', 'control', 'pendiente', 'Por definir', '2026-07-29 00:44:55', '2026-07-29 00:44:55');

DROP TABLE IF EXISTS `consultas`;
CREATE TABLE `consultas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expediente_id` int NOT NULL,
  `fecha` date NOT NULL,
  `motivo` text NOT NULL,
  `sintomas` text,
  `observaciones` text,
  `veterinario` varchar(100) NOT NULL,
  `peso_registrado` decimal(5,2) DEFAULT NULL,
  `temperatura` decimal(5,2) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `expediente_id` (`expediente_id`),
  CONSTRAINT `consultas_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expedientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;

INSERT INTO `consultas` (`id`, `expediente_id`, `fecha`, `motivo`, `sintomas`, `observaciones`, `veterinario`, `peso_registrado`, `temperatura`, `fecha_creacion`, `fecha_actualizacion`) VALUES (1, 1, '2026-05-20 06:00:00', 'Chequeo general anual', 'Ninguno', 'Excelente estado físico, hidratación óptima, coloración normal. Alimentación balanceada.', 'Dr. Carlos Gómez', '1.85', '31.50', '2026-07-02 21:59:56', '2026-07-02 22:31:48');
INSERT INTO `consultas` (`id`, `expediente_id`, `fecha`, `motivo`, `sintomas`, `observaciones`, `veterinario`, `peso_registrado`, `temperatura`, `fecha_creacion`, `fecha_actualizacion`) VALUES (2, 1, '2026-07-02 06:00:00', 'chequeo control', 'caida de piel', 'Normal, cruzando una etapa', 'Dr. Carlos Gómez', '85.00', '30.00', '2026-07-02 23:06:04', '2026-07-02 23:06:04');
INSERT INTO `consultas` (`id`, `expediente_id`, `fecha`, `motivo`, `sintomas`, `observaciones`, `veterinario`, `peso_registrado`, `temperatura`, `fecha_creacion`, `fecha_actualizacion`) VALUES (3, 1, '2026-07-07 06:00:00', 'Cola cortada', 'fiebre, sangrado', 'Un gato le mordio la cola, se le administraron medicamentos y se vendo', 'Dr Carlos Gomez', '0.50', '30.00', '2026-07-07 18:34:06', '2026-11-10 04:11:32');

DROP TABLE IF EXISTS `detalles_pedido`;
CREATE TABLE `detalles_pedido` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `pedido_id` int unsigned NOT NULL,
  `producto_id` int unsigned NOT NULL,
  `cantidad` int unsigned NOT NULL DEFAULT '1',
  `precio_unitario` decimal(10,2) unsigned NOT NULL,
  `productos_id` int unsigned NOT NULL,
  `pedidos_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalles_pedidos_productos1_idx` (`productos_id`),
  KEY `fk_detalles_pedidos_pedidos1_idx` (`pedidos_id`),
  CONSTRAINT `fk_detalles_pedidos_pedidos1` FOREIGN KEY (`pedidos_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `fk_detalles_pedidos_productos1` FOREIGN KEY (`productos_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb3;

INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (1, 1, 2, 1, '12000.00', 2, 1);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (2, 2, 1, 1, '8500.00', 1, 2);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (3, 3, 4, 10, '18500.00', 4, 3);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (4, 4, 6, 1, '5500.00', 6, 4);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (5, 4, 3, 1, '7200.00', 3, 4);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (6, 5, 6, 2, '5500.00', 6, 5);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (7, 6, 2, 1, '12000.00', 2, 6);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (8, 7, 6, 1, '5500.00', 6, 7);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (9, 8, 2, 1, '12000.00', 2, 8);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (10, 9, 4, 5, '18500.00', 4, 9);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (11, 9, 3, 1, '7200.00', 3, 9);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (12, 10, 4, 5, '18500.00', 4, 10);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (13, 10, 3, 2, '7200.00', 3, 10);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (14, 11, 2, 1, '12000.00', 2, 11);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (15, 12, 5, 1, '4500.00', 5, 12);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (16, 13, 5, 1, '4500.00', 5, 13);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (17, 14, 5, 1, '4500.00', 5, 14);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (18, 15, 5, 1, '4500.00', 5, 15);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (19, 16, 5, 1, '4500.00', 5, 16);
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario`, `productos_id`, `pedidos_id`) VALUES (20, 17, 4, 5, '18500.00', 4, 17);

DROP TABLE IF EXISTS `expedientes`;
CREATE TABLE `expedientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `paciente_id` int NOT NULL,
  `fecha_apertura` date NOT NULL,
  `fecha_cierre` date DEFAULT NULL,
  `notas_generales` text,
  `alergias` text,
  `enfermedades_cronicas` text,
  `vacunas` text,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `paciente_id` (`paciente_id`),
  CONSTRAINT `expedientes_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3;

INSERT INTO `expedientes` (`id`, `paciente_id`, `fecha_apertura`, `fecha_cierre`, `notas_generales`, `alergias`, `enfermedades_cronicas`, `vacunas`, `fecha_creacion`, `fecha_actualizacion`) VALUES (1, 1, '2023-06-01 06:00:00', NULL, 'Mascota activa y saludable. Comportamiento dócil.', 'Ninguna conocida', 'Ninguna', 'Desparasitación al día (Mayo 2026)', '2026-07-02 21:59:56', '2026-07-02 21:59:56');
INSERT INTO `expedientes` (`id`, `paciente_id`, `fecha_apertura`, `fecha_cierre`, `notas_generales`, `alergias`, `enfermedades_cronicas`, `vacunas`, `fecha_creacion`, `fecha_actualizacion`) VALUES (2, 2, '2026-07-02 06:00:00', NULL, 'Apertura de historial clínico en control preventivo.', 'Ninguna conocida', 'Ninguna', 'Esquema completo', '2026-07-02 23:52:13', '2026-07-02 23:52:13');
INSERT INTO `expedientes` (`id`, `paciente_id`, `fecha_apertura`, `fecha_cierre`, `notas_generales`, `alergias`, `enfermedades_cronicas`, `vacunas`, `fecha_creacion`, `fecha_actualizacion`) VALUES (3, 3, '2026-07-02 06:00:00', NULL, 'Apertura de historial clínico en control preventivo.', 'Ninguna conocida', 'Ninguna', 'Esquema completo', '2026-07-02 23:52:13', '2026-07-02 23:52:13');
INSERT INTO `expedientes` (`id`, `paciente_id`, `fecha_apertura`, `fecha_cierre`, `notas_generales`, `alergias`, `enfermedades_cronicas`, `vacunas`, `fecha_creacion`, `fecha_actualizacion`) VALUES (4, 4, '2026-07-02 06:00:00', NULL, 'Apertura de historial clínico en control preventivo.', 'Ninguna conocida', 'Ninguna', 'Esquema completo', '2026-07-02 23:52:13', '2026-07-02 23:52:13');
INSERT INTO `expedientes` (`id`, `paciente_id`, `fecha_apertura`, `fecha_cierre`, `notas_generales`, `alergias`, `enfermedades_cronicas`, `vacunas`, `fecha_creacion`, `fecha_actualizacion`) VALUES (8, 10, '2026-07-06 06:00:00', NULL, NULL, 'Ninguna', 'Ninguna', 'Ninguna', '2026-07-06 20:14:33', '2026-07-06 20:14:33');

DROP TABLE IF EXISTS `movimientos_inventario`;
CREATE TABLE `movimientos_inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int unsigned NOT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `cantidad` int NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_movimiento_producto` (`producto_id`),
  KEY `fk_movimiento_usuario` (`usuario_id`),
  CONSTRAINT `fk_movimiento_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movimiento_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (1, 1, 'entrada', 20, 'Compra de lote inicial a distribuidora', '2026-07-27 02:53:44', 1);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (2, 4, 'salida', 2, 'Uso clínico en incubadora de reptiles', '2026-07-27 02:53:44', 1);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (3, 1, 'entrada', 5, 'Donación', '2026-07-27 02:56:40', 14);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (4, 2, 'salida', 1, 'Pedido Completado y Pagado - VET-598070', '2026-07-07 20:34:24', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (5, 6, 'salida', 2, 'Pedido Completado y Pagado - VET-832573', '2026-07-07 20:45:52', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (6, 2, 'salida', 1, 'Pedido Completado y Pagado - VET-902800', '2026-07-07 20:46:07', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (7, 6, 'salida', 1, 'Pedido Completado y Pagado - VET-501187', '2026-07-07 20:50:33', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (8, 5, 'salida', 1, 'Compra en tienda - Pedido VET-202784', '2026-07-28 01:12:27', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (9, 5, 'salida', 1, 'Compra en tienda - Pedido VET-590519', '2026-07-28 01:15:41', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (10, 5, 'salida', 1, 'Compra en tienda - Pedido VET-904243', '2026-07-28 01:24:24', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (11, 5, 'salida', 1, 'Compra en tienda - Pedido VET-701920', '2026-07-28 02:24:57', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (12, 5, 'salida', 1, 'Pedido Completado y Pagado - VET-272102', '2026-07-29 01:06:12', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (13, 4, 'salida', 5, 'Pedido Completado y Pagado - VET-106569', '2026-07-29 01:06:05', 2);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (14, 6, 'entrada', 16, 'compra', '2026-07-29 01:03:24', 1);
INSERT INTO `movimientos_inventario` (`id`, `producto_id`, `tipo`, `cantidad`, `motivo`, `fecha`, `usuario_id`) VALUES (15, 5, 'salida', 1, 'vencimiento', '2026-07-29 01:04:06', 1);

DROP TABLE IF EXISTS `notificaciones`;
CREATE TABLE `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `leida` tinyint(1) DEFAULT '0',
  `data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (1, 1, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Iguana Verde (Draco) el 9/11/2026 a las 10:30 AM ha sido confirmada con Dra. Sofía Mora!', 'CITA_CONFIRMADA', 0, '{"tipo":"CITA_CONFIRMADA","citaId":"1","screen":"Citas"}', '2026-11-09 23:03:43');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (2, 1, '🛍️ ¡Tu pedido está listo! - VetExóticos', 'Tu pedido #VET-883921 ya está empacado y listo para ser retirado en la clínica veterinaria.', 'PEDIDO_LISTO', 0, '{"tipo":"PEDIDO_LISTO","screen":"Tienda","pedidoId":"1","codigoRetiro":"VET-883921"}', '2026-11-09 23:03:43');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (3, 1, '🩺 Nueva Consulta Médica - VetExóticos', 'El Dr. Dr. Alejandro Peña ha registrado una nueva consulta médica para Iguana Verde (Draco): "Control de muda y suplemento vitamínico".', 'NUEVA_CONSULTA', 0, '{"tipo":"NUEVA_CONSULTA","screen":"Consultas","consultaId":"1"}', '2026-11-09 23:03:43');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (4, 14, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Iguana Verde (Draco) el 9/11/2026 a las 10:30 AM ha sido confirmada con Dra. Sofía Mora!', 'CITA_CONFIRMADA', 1, '{"tipo":"CITA_CONFIRMADA","citaId":"1","screen":"Citas"}', '2026-11-10 03:32:29');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (5, 14, '🛍️ ¡Tu pedido está listo! - VetExóticos', 'Tu pedido #VET-883921 ya está empacado y listo para ser retirado en la clínica veterinaria.', 'PEDIDO_LISTO', 1, '{"tipo":"PEDIDO_LISTO","screen":"Tienda","pedidoId":"1","codigoRetiro":"VET-883921"}', '2026-11-10 03:32:41');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (6, 14, '🩺 Nueva Consulta Médica - VetExóticos', 'El Dr. Dr. Alejandro Peña ha registrado una nueva consulta médica para Iguana Verde (Draco): "Control de muda y suplemento vitamínico".', 'NUEVA_CONSULTA', 1, '{"tipo":"NUEVA_CONSULTA","screen":"Consultas","consultaId":"1"}', '2026-11-10 03:33:03');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (7, 14, '🩺 Nueva Consulta Médica - VetExóticos', 'El Dr. Dr. Alejandro Peña ha registrado una nueva consulta médica para Iguana Verde (Draco): "Control de muda y suplemento vitamínico".', 'NUEVA_CONSULTA', 1, '{"tipo":"NUEVA_CONSULTA","screen":"Consultas","consultaId":"1"}', '2026-11-10 03:33:29');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (8, 14, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Iguana Verde (Draco) el 9/11/2026 a las 10:30 AM ha sido confirmada con Dra. Sofía Mora!', 'CITA_CONFIRMADA', 1, '{"tipo":"CITA_CONFIRMADA","citaId":"1","screen":"Citas"}', '2026-11-10 03:33:43');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (9, 2, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Carmen el 2026-07-28 a las 06:00 ha sido confirmada con Por definir!', 'CITA_CONFIRMADA', 0, '{"tipo":"CITA_CONFIRMADA","citaId":"7","screen":"Citas"}', '2026-11-10 03:46:03');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (10, 2, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Carmen el 2026-07-28 a las 06:00 ha sido confirmada con Por definir!', 'CITA_CONFIRMADA', 0, '{"tipo":"CITA_CONFIRMADA","citaId":"7","screen":"Citas"}', '2026-11-10 03:47:11');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (11, 14, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Iguana Verde (Draco) el 2026-11-10 a las 10:00 AM ha sido confirmada con Dr. Administrador!', 'CITA_CONFIRMADA', 1, '{"tipo":"CITA_CONFIRMADA","citaId":"1","screen":"Citas"}', '2026-11-10 03:50:44');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (12, 2, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Carmen el 2026-07-28 a las 06:00 ha sido confirmada con Por definir!', 'CITA_CONFIRMADA', 0, '{"tipo":"CITA_CONFIRMADA","citaId":"7","screen":"Citas"}', '2026-11-10 03:55:28');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (13, 14, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Carmen el 2026-07-28 a las 06:00 ha sido confirmada con Por definir!', 'CITA_CONFIRMADA', 1, '{"tipo":"CITA_CONFIRMADA","citaId":"7","screen":"Citas"}', '2026-11-10 03:55:28');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (14, 2, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Carmen el 2026-07-28 a las 06:00 ha sido confirmada con Por definir!', 'CITA_CONFIRMADA', 0, '{"tipo":"CITA_CONFIRMADA","citaId":"7","screen":"Citas"}', '2026-11-10 03:55:53');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (15, 14, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Carmen el 2026-07-28 a las 06:00 ha sido confirmada con Por definir!', 'CITA_CONFIRMADA', 1, '{"tipo":"CITA_CONFIRMADA","citaId":"7","screen":"Citas"}', '2026-11-10 03:55:53');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (16, 2, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Carmen el 2026-07-28 a las 06:00 ha sido confirmada con Dr. Oscar reyes!', 'CITA_CONFIRMADA', 0, '{"tipo":"CITA_CONFIRMADA","citaId":"7","screen":"Citas"}', '2026-11-10 03:56:15');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (17, 14, '📅 Cita Confirmada - VetExóticos', '¡Tu cita para Carmen el 2026-07-28 a las 06:00 ha sido confirmada con Dr. Oscar reyes!', 'CITA_CONFIRMADA', 1, '{"tipo":"CITA_CONFIRMADA","citaId":"7","screen":"Citas"}', '2026-11-10 03:56:15');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (18, 1, '🛒 Nuevo Pedido en Tienda - VetExóticos', 'Se ha recibido un nuevo pedido #VET-TEST por ₡12,500.', 'NUEVO_PEDIDO_ADMIN', 0, '{"tipo":"NUEVO_PEDIDO_ADMIN","screen":"Inventario"}', '2026-11-10 04:08:22');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (19, 6, '🛒 Nuevo Pedido en Tienda - VetExóticos', 'Se ha recibido un nuevo pedido #VET-TEST por ₡12,500.', 'NUEVO_PEDIDO_ADMIN', 0, '{"tipo":"NUEVO_PEDIDO_ADMIN","screen":"Inventario"}', '2026-11-10 04:08:22');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (20, 10, '🛒 Nuevo Pedido en Tienda - VetExóticos', 'Se ha recibido un nuevo pedido #VET-TEST por ₡12,500.', 'NUEVO_PEDIDO_ADMIN', 0, '{"tipo":"NUEVO_PEDIDO_ADMIN","screen":"Inventario"}', '2026-11-10 04:08:22');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (21, 14, '🛒 Nuevo Pedido en Tienda - VetExóticos', 'Se ha recibido un nuevo pedido #VET-TEST por ₡12,500.', 'NUEVO_PEDIDO_ADMIN', 1, '{"tipo":"NUEVO_PEDIDO_ADMIN","screen":"Inventario"}', '2026-11-10 04:08:22');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (22, 14, '🩺 Consulta Médica Actualizada - VetExóticos', 'La consulta médica de Iguana Draco ha sido actualizada con nuevas indicaciones por Dr. Dra. Shirley.', 'CONSULTA_ACTUALIZADA', 1, '{"tipo":"CONSULTA_ACTUALIZADA","screen":"Consultas","consultaId":"1"}', '2026-11-10 04:08:23');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (23, 14, '🦎 Paciente Registrado - VetExóticos', 'El paciente Gecko Leopardo (Eublepharis macularius) ha sido registrado exitosamente en el sistema.', 'PACIENTE_GUARDADO', 1, '{"tipo":"PACIENTE_GUARDADO","screen":"Mascotas","pacienteId":"1"}', '2026-11-10 04:08:24');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (24, 14, '📋 Expediente Clínico Creado - VetExóticos', 'El expediente #EXP-2026-009 (Gecko Leopardo) ha sido aperturado correctamente.', 'EXPEDIENTE_GUARDADO', 1, '{"tipo":"EXPEDIENTE_GUARDADO","screen":"Expedientes","expedienteId":"1"}', '2026-11-10 04:08:24');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (25, 1, '🛡️ Nuevo Administrador Registrado - VetExóticos', 'Se ha registrado una nueva cuenta de administrador para Carlos Veterinario (carlos@vetexoticos.com) en el sistema.', 'NUEVO_ADMIN', 0, '{"tipo":"NUEVO_ADMIN","screen":"Usuarios"}', '2026-11-10 04:08:25');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (26, 6, '🛡️ Nuevo Administrador Registrado - VetExóticos', 'Se ha registrado una nueva cuenta de administrador para Carlos Veterinario (carlos@vetexoticos.com) en el sistema.', 'NUEVO_ADMIN', 0, '{"tipo":"NUEVO_ADMIN","screen":"Usuarios"}', '2026-11-10 04:08:25');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (27, 10, '🛡️ Nuevo Administrador Registrado - VetExóticos', 'Se ha registrado una nueva cuenta de administrador para Carlos Veterinario (carlos@vetexoticos.com) en el sistema.', 'NUEVO_ADMIN', 0, '{"tipo":"NUEVO_ADMIN","screen":"Usuarios"}', '2026-11-10 04:08:25');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (28, 14, '🛡️ Nuevo Administrador Registrado - VetExóticos', 'Se ha registrado una nueva cuenta de administrador para Carlos Veterinario (carlos@vetexoticos.com) en el sistema.', 'NUEVO_ADMIN', 1, '{"tipo":"NUEVO_ADMIN","screen":"Usuarios"}', '2026-11-10 04:08:25');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (29, 2, '🩺 Consulta Médica Actualizada - VetExóticos', 'La consulta médica de Coco ha sido actualizada con nuevas indicaciones por Dr. Dr Carlos Gomez.', 'CONSULTA_ACTUALIZADA', 0, '{"tipo":"CONSULTA_ACTUALIZADA","screen":"Consultas","consultaId":"3"}', '2026-11-10 04:11:32');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (30, 14, '🩺 Consulta Médica Actualizada - VetExóticos', 'La consulta médica de Coco ha sido actualizada con nuevas indicaciones por Dr. Dr Carlos Gomez.', 'CONSULTA_ACTUALIZADA', 1, '{"tipo":"CONSULTA_ACTUALIZADA","screen":"Consultas","consultaId":"3"}', '2026-11-10 04:11:32');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (31, 1, '🛡️ Alerta para Administradores', 'Este mensaje llega a TODOS los perfiles de administradores registrados.', 'ADMIN_TEST', 0, '{"tipo":"ADMIN_TEST"}', '2026-11-10 04:29:45');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (32, 6, '🛡️ Alerta para Administradores', 'Este mensaje llega a TODOS los perfiles de administradores registrados.', 'ADMIN_TEST', 0, '{"tipo":"ADMIN_TEST"}', '2026-11-10 04:29:45');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (33, 10, '🛡️ Alerta para Administradores', 'Este mensaje llega a TODOS los perfiles de administradores registrados.', 'ADMIN_TEST', 0, '{"tipo":"ADMIN_TEST"}', '2026-11-10 04:29:45');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (34, 14, '🛡️ Alerta para Administradores', 'Este mensaje llega a TODOS los perfiles de administradores registrados.', 'ADMIN_TEST', 0, '{"tipo":"ADMIN_TEST"}', '2026-11-10 04:29:45');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (35, 2, '📢 Aviso General para Clientes', 'Este mensaje llega a TODOS los perfiles de clientes registrados.', 'CLIENTE_TEST', 0, '{"tipo":"CLIENTE_TEST"}', '2026-11-10 04:29:46');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (36, 3, '📢 Aviso General para Clientes', 'Este mensaje llega a TODOS los perfiles de clientes registrados.', 'CLIENTE_TEST', 0, '{"tipo":"CLIENTE_TEST"}', '2026-11-10 04:29:46');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (37, 8, '📢 Aviso General para Clientes', 'Este mensaje llega a TODOS los perfiles de clientes registrados.', 'CLIENTE_TEST', 0, '{"tipo":"CLIENTE_TEST"}', '2026-11-10 04:29:46');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (38, 9, '📢 Aviso General para Clientes', 'Este mensaje llega a TODOS los perfiles de clientes registrados.', 'CLIENTE_TEST', 0, '{"tipo":"CLIENTE_TEST"}', '2026-11-10 04:29:46');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (39, 12, '📢 Aviso General para Clientes', 'Este mensaje llega a TODOS los perfiles de clientes registrados.', 'CLIENTE_TEST', 0, '{"tipo":"CLIENTE_TEST"}', '2026-11-10 04:29:46');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (40, 11, '📢 Aviso General para Clientes', 'Este mensaje llega a TODOS los perfiles de clientes registrados.', 'CLIENTE_TEST', 0, '{"tipo":"CLIENTE_TEST"}', '2026-11-10 04:29:46');
INSERT INTO `notificaciones` (`id`, `usuario_id`, `titulo`, `mensaje`, `tipo`, `leida`, `data`, `created_at`) VALUES (41, 2, '📦 Pedido Recibido - VetExóticos', 'Hemos recibido tu pedido #VET-774912 (₡18 500). Te avisaremos cuando esté listo.', 'PEDIDO_RECIBIDO', 0, '{"tipo":"PEDIDO_RECIBIDO","screen":"Tienda","pedidoId":"99"}', '2026-11-10 04:42:12');

DROP TABLE IF EXISTS `pacientes`;
CREATE TABLE `pacientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `propietario_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `especie` varchar(100) NOT NULL,
  `tipo_animal` enum('Reptil','Ave','Anfibio','Mamifero_Exotico','Aracnido','Otro') NOT NULL,
  `habitat` varchar(100) DEFAULT NULL,
  `dieta` varchar(255) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('Macho','Hembra','Indeterminado') DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `microchip` varchar(100) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `propietario_id` (`propietario_id`),
  CONSTRAINT `pacientes_ibfk_1` FOREIGN KEY (`propietario_id`) REFERENCES `propietarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3;

INSERT INTO `pacientes` (`id`, `propietario_id`, `nombre`, `especie`, `tipo_animal`, `habitat`, `dieta`, `fecha_nacimiento`, `sexo`, `peso`, `microchip`, `fecha_creacion`, `fecha_actualizacion`) VALUES (1, 1, 'Coco', 'Iguana verde', 'Reptil', 'Terrario tropical', 'Herbivoro', '2023-05-10 06:00:00', 'Macho', '1.85', '985121006874251', '2026-07-02 21:59:56', '2026-07-02 21:59:56');
INSERT INTO `pacientes` (`id`, `propietario_id`, `nombre`, `especie`, `tipo_animal`, `habitat`, `dieta`, `fecha_nacimiento`, `sexo`, `peso`, `microchip`, `fecha_creacion`, `fecha_actualizacion`) VALUES (2, 1, 'Spike', 'Erizo de tierra', 'Mamifero_Exotico', 'Jaula amplia', 'Insectivoro', '2024-01-15 06:00:00', 'Macho', '0.45', NULL, '2026-07-02 23:52:13', '2026-07-02 23:52:13');
INSERT INTO `pacientes` (`id`, `propietario_id`, `nombre`, `especie`, `tipo_animal`, `habitat`, `dieta`, `fecha_nacimiento`, `sexo`, `peso`, `microchip`, `fecha_creacion`, `fecha_actualizacion`) VALUES (3, 2, 'Rocky', 'Tortuga rusa', 'Reptil', 'Terrario seco', 'Herbivoro', '2024-01-15 06:00:00', 'Macho', '0.95', NULL, '2026-07-02 23:52:13', '2026-07-02 23:52:13');
INSERT INTO `pacientes` (`id`, `propietario_id`, `nombre`, `especie`, `tipo_animal`, `habitat`, `dieta`, `fecha_nacimiento`, `sexo`, `peso`, `microchip`, `fecha_creacion`, `fecha_actualizacion`) VALUES (4, 2, 'Paco', 'Loro frente azul', 'Ave', 'Pajarera amplia', 'Omnivoro', '2024-01-15 06:00:00', 'Macho', '0.38', NULL, '2026-07-02 23:52:13', '2026-07-02 23:52:13');
INSERT INTO `pacientes` (`id`, `propietario_id`, `nombre`, `especie`, `tipo_animal`, `habitat`, `dieta`, `fecha_nacimiento`, `sexo`, `peso`, `microchip`, `fecha_creacion`, `fecha_actualizacion`) VALUES (9, 1, 'Carmen', 'Rana', 'Anfibio', 'Terrario humedo', 'Insectivoro', NULL, 'Indeterminado', '1.00', 'N-A', '2026-07-06 19:51:16', '2026-07-06 19:51:16');
INSERT INTO `pacientes` (`id`, `propietario_id`, `nombre`, `especie`, `tipo_animal`, `habitat`, `dieta`, `fecha_nacimiento`, `sexo`, `peso`, `microchip`, `fecha_creacion`, `fecha_actualizacion`) VALUES (10, 1, 'Shecko', 'Serpiente', 'Reptil', 'Terrario', 'Omnivoro', NULL, 'Macho', '0.00', 'N-A', '2026-07-06 20:06:40', '2026-07-06 20:06:40');

DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE `pedidos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `fecha_pedido` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('pendiente','pagado','preparando','listo','retirado','cancelado') NOT NULL DEFAULT 'pendiente',
  `subtotal` decimal(10,2) unsigned NOT NULL,
  `iva` decimal(10,2) unsigned NOT NULL,
  `total` decimal(10,2) unsigned NOT NULL,
  `codigo_retiro` varchar(20) NOT NULL,
  `usuarios_id` int NOT NULL,
  `metodo_pago` varchar(50) DEFAULT 'efectivo',
  `comprobante_pago` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_retiro_UNIQUE` (`codigo_retiro`),
  KEY `fk_pedidos_usuarios1_idx` (`usuarios_id`),
  CONSTRAINT `fk_pedidos_usuarios1` FOREIGN KEY (`usuarios_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb3;

INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (1, 2, '2026-07-07 20:34:24', 'retirado', '10619.47', '1380.53', '12000.00', 'VET-598070', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (2, 2, '2026-07-07 20:43:39', 'cancelado', '7522.12', '977.88', '8500.00', 'VET-828314', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (3, 2, '2026-07-07 20:44:59', 'preparando', '163716.81', '21283.19', '185000.00', 'VET-939464', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (4, 2, '2026-07-07 20:45:18', 'listo', '11238.94', '1461.06', '12700.00', 'VET-635520', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (5, 2, '2026-07-07 20:45:52', 'retirado', '9734.51', '1265.49', '11000.00', 'VET-832573', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (6, 2, '2026-07-07 20:46:07', 'retirado', '10619.47', '1380.53', '12000.00', 'VET-902800', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (7, 2, '2026-07-07 20:50:33', 'retirado', '4867.26', '632.74', '5500.00', 'VET-501187', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (8, 2, '2026-07-07 21:45:18', 'pendiente', '12000.00', '1560.00', '13560.00', 'VET-836205', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (9, 2, '2026-07-08 01:17:10', 'cancelado', '99700.00', '12961.00', '112661.00', 'VET-243335', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (10, 2, '2026-07-08 01:17:52', 'cancelado', '106900.00', '13897.00', '120797.00', 'VET-104140', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (11, 2, '2026-07-27 01:28:50', 'pendiente', '12000.00', '1560.00', '13560.00', 'VET-414856', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (12, 2, '2026-07-28 01:12:27', 'pendiente', '4500.00', '585.00', '5085.00', 'VET-202784', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (13, 2, '2026-07-28 01:15:41', 'pendiente', '4500.00', '585.00', '5085.00', 'VET-590519', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (14, 2, '2026-07-28 01:24:24', 'pendiente', '4500.00', '585.00', '5085.00', 'VET-904243', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (15, 2, '2026-07-28 02:24:57', 'pagado', '4500.00', '585.00', '5085.00', 'VET-701920', 2, 'tilopay', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (16, 2, '2026-07-28 02:26:07', 'retirado', '4500.00', '585.00', '5085.00', 'VET-272102', 2, 'efectivo', NULL);
INSERT INTO `pedidos` (`id`, `usuario_id`, `fecha_pedido`, `estado`, `subtotal`, `iva`, `total`, `codigo_retiro`, `usuarios_id`, `metodo_pago`, `comprobante_pago`) VALUES (17, 2, '2026-07-29 00:49:00', 'retirado', '92500.00', '12025.00', '104525.00', 'VET-106569', 2, 'tilopay', NULL);

DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text,
  `precio` decimal(10,2) unsigned NOT NULL,
  `stock` int unsigned NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `iva` int DEFAULT '13',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3;

INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `precio`, `stock`, `activo`, `creado_en`, `iva`) VALUES (1, 'Heno de Timothy Premium (500g)', 'Alimento fibroso esencial para conejos, cobayas y chinchillas. Favorece la digestión y el desgaste dental natural.', '8500.00', 30, 1, '2026-07-07 20:28:38', 13);
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `precio`, `stock`, `activo`, `creado_en`, `iva`) VALUES (2, 'Alimento Extruido para Loros y Guacamayas (1kg)', 'Mezcla balanceada de pellets extruidos con vitaminas y minerales para psitácidos grandes. Evita la selección de semillas.', '12000.00', 11, 1, '2026-07-07 20:28:38', 13);
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `precio`, `stock`, `activo`, `creado_en`, `iva`) VALUES (3, 'Suplemento de Calcio con Vitamina D3 (80g)', 'Polvo microfino de calcio con D3 para espolvorear sobre insectos y vegetales. Ideal para reptiles y anfibios en cautiverio.', '7200.00', 29, 1, '2026-07-07 20:28:38', 13);
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `precio`, `stock`, `activo`, `creado_en`, `iva`) VALUES (4, 'Placa Térmica para Terrarios (15W)', 'Proporciona una fuente de calor constante por debajo del terrario. Esencial para la termorregulación de serpientes y lagartos.', '18500.00', 6, 1, '2026-07-07 20:28:38', 13);
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `precio`, `stock`, `activo`, `creado_en`, `iva`) VALUES (5, 'Sustrato de Fibra de Coco (Bloque 650g)', 'Sustrato orgánico biodegradable de gran absorción. Ideal para terrarios húmedos de tortugas, ranas y lagartos.', '4500.00', 14, 1, '2026-07-07 20:28:38', 13);
INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `precio`, `stock`, `activo`, `creado_en`, `iva`) VALUES (6, 'Gotas de Vitamina C para Cobayas (30ml)', 'Suplemento líquido de vitamina C diaria para cobayas, ya que ellas no pueden sintetizarla por sí mismas. Evita el escorbuto.', '5500.00', 30, 1, '2026-07-07 20:28:38', 13);

DROP TABLE IF EXISTS `propietarios`;
CREATE TABLE `propietarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `cedula` varchar(50) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cedula` (`cedula`),
  UNIQUE KEY `email` (`email`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `propietarios_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3;

INSERT INTO `propietarios` (`id`, `usuario_id`, `nombre`, `apellido`, `cedula`, `telefono`, `email`, `fecha_creacion`, `fecha_actualizacion`) VALUES (1, 2, 'Juan', 'Perez', '1-1234-5678', '87654321', 'cliente@email.com', '2026-07-02 21:59:56', '2026-07-07 18:45:42');
INSERT INTO `propietarios` (`id`, `usuario_id`, `nombre`, `apellido`, `cedula`, `telefono`, `email`, `fecha_creacion`, `fecha_actualizacion`) VALUES (2, 3, 'Maria', 'Jose', '1-984-234', '22334455', 'maria@email.com', '2026-07-02 23:41:19', '2026-07-02 23:41:19');

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `rol` enum('admin','cliente') NOT NULL DEFAULT 'cliente',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `reset_code` varchar(6) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `push_token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb3;

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (1, 'Dr. Administrador', 'admin@clinica.com', '$2a$12$CHSp/0GYicNTnCvHVw57Mufn1GBHBXcF0GIq3jRO29B3PnaCFZXla', '12345678', 'admin', '2026-07-02 21:02:06', '2026-07-27 02:38:52', NULL, NULL, NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (2, 'Juan', 'cliente@email.com', '$2b$12$uuNGsnnSNwTNPnoYs0F8fOJYlHqjLa6mnNtLNv57X5mExI7zqngPu', '87654321', 'cliente', '2026-07-02 21:02:06', '2026-07-07 20:34:24', NULL, NULL, NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (3, 'Maria Jose', 'maria@email.com', '$2b$12$7zzQmXpUZF6q0IEaxcEzdOWc2PA00H8FMkJ3ZDpRBwsDuWq8ex76C', '22334455', 'cliente', '2026-07-02 21:12:45', '2026-07-02 21:12:45', NULL, NULL, NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (6, 'Dr. Oscar reyes', 'oscar@clinica.com', '$2b$12$Vbkw1o6F/ffrMM58gJ.leeX5mKlNUhSrrmiVHVKfPIi.CpD80fwEe', '34234332', 'admin', '2026-07-02 21:52:06', '2026-07-07 18:46:39', NULL, NULL, NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (8, 'Ana', 'ana@email.com', '$2b$12$dLSq/rFQDABWwr8BJNETy.876rHhFmKCSU3SxwARvRq/T22w0Rkmu', '33668844', 'cliente', '2026-07-07 18:12:55', '2026-07-07 18:13:19', NULL, NULL, NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (9, 'Esteban', 'esteban@email.com', '$2b$12$5SFiHdvCt.CWNuShWbuZ7ePBwQVQ2u1gjIk/WmYn160gmAtiGni8q', '77990000', 'cliente', '2026-07-07 18:21:05', '2026-07-07 18:21:05', NULL, NULL, NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (10, 'Dr Carlos Gomez', 'carlos@clinica.com', '$2b$12$tgiiDBOVF9r3Ete1sUHO1ujmtj2oWWMFT6Pppu29Hs2/4pfCJ91wq', '88887777', 'admin', '2026-07-07 18:38:38', '2026-07-07 18:38:38', NULL, NULL, NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (11, 'Admin', 'admin@email.com', '$2b$12$ozH7tHei7Y9NRcLANqAX.eu7m7G8Kk5.kUtHWIL7CgIMcLcCmW.M2', '22332233', 'cliente', '2026-07-07 23:16:13', '2026-07-07 23:16:13', NULL, NULL, NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (12, 'Sara Valverde', 'sara@email.com', '$2b$12$M9HCXozp3.tCdh.hdrfSne9rDyO1TuXymZ8uXdsgdjOcKK.l3jJG6', '30033003', 'cliente', '2026-07-07 23:27:38', '2026-07-07 23:27:38', NULL, NULL, NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `rol`, `fecha_creacion`, `fecha_actualizacion`, `reset_code`, `reset_expires`, `push_token`) VALUES (14, 'Shirley Cespedes', 'shirleycespedes2324@gmail.com', '$2a$12$2PA.doujEnuSJa6sCTmzvOhGP/DRJ7D9s9tSbYRSwhUJITk5bwNGC', '99887766', 'admin', '2026-07-22 01:53:22', '2026-11-10 04:18:25', NULL, NULL, 'esQgrN1u0nuoFrqFO8tT2F:APA91bHdbI1xK_jYJuU34jtrCbK912YfjMwYy1Jpw4sws0Ju0gOuecWl5V07kDarV92sC9TNsiwhF28fZ6tUY6YosaZO2WJQDbSl2YiLYviDRsqMT1vQBPc');

SET FOREIGN_KEY_CHECKS = 1;
