-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS subasta
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE subasta;

-- Tabla usuarios
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla roles
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);

-- Relación usuarios-roles (N:N)
CREATE TABLE usuarios_roles (
    id_usuario_rol INT NOT NULL AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    PRIMARY KEY (id_usuario_rol),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- Tabla bienes
CREATE TABLE bienes (
    id_bien INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    valor_inicial DECIMAL(12,2) NOT NULL,
    imagen_url VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- Tabla subastas
CREATE TABLE subastas (
    id_subasta INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    precio_base DECIMAL(12,2) NOT NULL,
    estado ENUM('programada','activa','finalizada','cancelada') DEFAULT 'programada',
    FOREIGN KEY (id_bien) REFERENCES bienes(id_bien)
);

-- Tabla pujas
CREATE TABLE pujas (
    id_puja INT AUTO_INCREMENT PRIMARY KEY,
    id_subasta INT NOT NULL,
    id_usuario INT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha_puja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_subasta) REFERENCES subastas(id_subasta),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- Tabla adjudicaciones
CREATE TABLE adjudicaciones (
    id_adjudicacion INT AUTO_INCREMENT PRIMARY KEY,
    id_subasta INT NOT NULL,
    id_puja INT NOT NULL,
    fecha_adjudicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente','pagada','cancelada') DEFAULT 'pendiente',
    FOREIGN KEY (id_subasta) REFERENCES subastas(id_subasta),
    FOREIGN KEY (id_puja) REFERENCES pujas(id_puja)
);

-- Tabla pagos
CREATE TABLE pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_adjudicacion INT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    metodo ENUM('tarjeta','transferencia','efectivo','otro') DEFAULT 'otro',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente','confirmado','fallido') DEFAULT 'pendiente',
    FOREIGN KEY (id_adjudicacion) REFERENCES adjudicaciones(id_adjudicacion)
);

-- Extiende usuarios
ALTER TABLE usuarios
  ADD COLUMN apellidos VARCHAR(120) NULL,
  ADD COLUMN fecha_nacimiento DATE NULL,
  ADD COLUMN documento VARCHAR(40) NULL,
  ADD COLUMN rol_nombre ENUM('Administrador','Vendedor','Cliente') NOT NULL DEFAULT 'Cliente',
  ADD COLUMN acepta_politicas TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN email_verificado TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN estado ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  ADD COLUMN motivo_rechazo VARCHAR(255) NULL;

-- Archivos de cédula
CREATE TABLE IF NOT EXISTS usuarios_documentos(
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo ENUM('cedula_frente','cedula_reverso') NOT NULL,
  ruta VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

-- Verificación de email
CREATE TABLE IF NOT EXISTS verificaciones_email(
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token VARCHAR(64) NOT NULL,
  expira_en DATETIME NOT NULL,
  usado TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

-- 2FA por correo (simple)
CREATE TABLE IF NOT EXISTS auth_tokens(
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo ENUM('2fa_login') NOT NULL,
  token VARCHAR(64) NOT NULL,
  expira_en DATETIME NOT NULL,
  usado TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

