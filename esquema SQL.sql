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
