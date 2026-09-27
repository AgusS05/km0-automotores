-- Km0 Automotores — Esquema de base de datos (PostgreSQL)
-- Segunda Entrega — Trabajo Final Integrador

CREATE TABLE marca (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE modelo (
    id SERIAL PRIMARY KEY,
    marca_id INTEGER NOT NULL REFERENCES marca(id),
    nombre VARCHAR(100) NOT NULL,
    tipo_carroceria VARCHAR(50),
    anio INTEGER NOT NULL
);

CREATE TABLE version (
    id SERIAL PRIMARY KEY,
    modelo_id INTEGER NOT NULL REFERENCES modelo(id),
    nombre_version VARCHAR(100) NOT NULL,
    precio NUMERIC(12,2) NOT NULL,
    motor VARCHAR(50),
    transmision VARCHAR(30),
    combustible VARCHAR(30)
);

CREATE TABLE sucursal (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(150),
    ciudad VARCHAR(80)
);

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('CLIENTE', 'VENDEDOR', 'ADMIN', 'INSTRUCTOR')),
    sucursal_id INTEGER REFERENCES sucursal(id)
);

CREATE TABLE vehiculo_demo (
    id SERIAL PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES version(id),
    sucursal_id INTEGER NOT NULL REFERENCES sucursal(id),
    patente VARCHAR(10) NOT NULL UNIQUE,
    disponible BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE turno_test_drive (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES usuario(id),
    vehiculo_demo_id INTEGER NOT NULL REFERENCES vehiculo_demo(id),
    vendedor_id INTEGER NOT NULL REFERENCES usuario(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'AUSENTE')),
    -- evita que se reserve el mismo vehículo demo en el mismo horario
    CONSTRAINT uq_turno_vehiculo_horario UNIQUE (vehiculo_demo_id, fecha, hora_inicio)
);

CREATE TABLE clase_manejo (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES usuario(id),
    instructor_id INTEGER NOT NULL REFERENCES usuario(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'AUSENTE')),
    CONSTRAINT uq_clase_instructor_horario UNIQUE (instructor_id, fecha, hora_inicio)
);

-- ============================================================
-- ÍNDICES PRINCIPALES
-- Postgres no crea índice automático sobre columnas FK (solo sobre PK
-- y columnas UNIQUE). Se agregan explícitamente sobre las FK que se
-- usan en joins y búsquedas frecuentes.
-- ============================================================

CREATE INDEX idx_modelo_marca ON modelo(marca_id);
CREATE INDEX idx_version_modelo ON version(modelo_id);
CREATE INDEX idx_vehiculo_demo_version ON vehiculo_demo(version_id);
CREATE INDEX idx_vehiculo_demo_sucursal ON vehiculo_demo(sucursal_id);
CREATE INDEX idx_usuario_sucursal ON usuario(sucursal_id);
CREATE INDEX idx_usuario_rol ON usuario(rol);

CREATE INDEX idx_turno_cliente ON turno_test_drive(cliente_id);
CREATE INDEX idx_turno_vehiculo ON turno_test_drive(vehiculo_demo_id);
CREATE INDEX idx_turno_vendedor ON turno_test_drive(vendedor_id);
CREATE INDEX idx_turno_fecha ON turno_test_drive(fecha);

CREATE INDEX idx_clase_cliente ON clase_manejo(cliente_id);
CREATE INDEX idx_clase_instructor ON clase_manejo(instructor_id);
CREATE INDEX idx_clase_fecha ON clase_manejo(fecha);
