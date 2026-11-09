-- =====================================================================
-- Km0 Automotores — Esquema de base de datos (PostgreSQL)
-- Migración V1: tablas, restricciones e índices.
--
-- Base: el esquema aprobado en la Segunda Entrega (8 entidades).
-- Ampliaciones para la implementación (ver docs/cambios-esquema.md):
--   * imagen_modelo y color_modelo (galería de fotos y visor 3D)
--   * horarios en sucursal, ficha técnica ampliada en version
--   * índices únicos PARCIALES en turnos: un turno cancelado libera el horario
-- =====================================================================

CREATE TABLE marca (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE modelo (
    id               SERIAL PRIMARY KEY,
    marca_id         INTEGER NOT NULL REFERENCES marca(id),
    nombre           VARCHAR(100) NOT NULL,
    tipo_carroceria  VARCHAR(20)  NOT NULL
        CHECK (tipo_carroceria IN ('SEDAN', 'HATCHBACK', 'SUV', 'PICKUP')),
    anio             INTEGER NOT NULL CHECK (anio BETWEEN 2000 AND 2100),
    descripcion      VARCHAR(1000),
    destacado        BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_modelo_marca_nombre UNIQUE (marca_id, nombre)
);

CREATE TABLE version (
    id              SERIAL PRIMARY KEY,
    modelo_id       INTEGER NOT NULL REFERENCES modelo(id),
    nombre_version  VARCHAR(100) NOT NULL,
    precio          NUMERIC(14,2) NOT NULL CHECK (precio > 0),
    motor           VARCHAR(60),
    potencia_cv     INTEGER CHECK (potencia_cv > 0),
    transmision     VARCHAR(40),
    combustible     VARCHAR(20) NOT NULL
        CHECK (combustible IN ('NAFTA', 'DIESEL', 'HIBRIDO', 'ELECTRICO')),
    traccion        VARCHAR(30),
    puertas         INTEGER CHECK (puertas BETWEEN 2 AND 5),
    plazas          INTEGER CHECK (plazas BETWEEN 2 AND 9),
    CONSTRAINT uq_version_modelo_nombre UNIQUE (modelo_id, nombre_version)
);

-- Fotos de cada modelo (galería). Las de ejemplo son de Wikimedia Commons:
-- fuente_url apunta a la página del archivo, donde figuran autor y licencia.
CREATE TABLE imagen_modelo (
    id          SERIAL PRIMARY KEY,
    modelo_id   INTEGER NOT NULL REFERENCES modelo(id) ON DELETE CASCADE,
    url         VARCHAR(500) NOT NULL,
    fuente_url  VARCHAR(500),
    credito     VARCHAR(200),
    orden       INTEGER NOT NULL DEFAULT 0
);

-- Colores disponibles de cada modelo (los usa el visor 3D).
CREATE TABLE color_modelo (
    id         SERIAL PRIMARY KEY,
    modelo_id  INTEGER NOT NULL REFERENCES modelo(id) ON DELETE CASCADE,
    nombre     VARCHAR(60) NOT NULL,
    hex        VARCHAR(7)  NOT NULL CHECK (hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE sucursal (
    id                SERIAL PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL UNIQUE,
    direccion         VARCHAR(150) NOT NULL,
    ciudad            VARCHAR(80)  NOT NULL,
    telefono          VARCHAR(30),
    -- Lunes a viernes de horario_apertura a horario_cierre.
    -- Sábados de horario_apertura a cierre_sabado (NULL = no abre los sábados).
    -- Domingos cerrado.
    horario_apertura  TIME NOT NULL DEFAULT '09:00',
    horario_cierre    TIME NOT NULL DEFAULT '18:00',
    cierre_sabado     TIME,
    CHECK (horario_cierre > horario_apertura),
    CHECK (cierre_sabado IS NULL OR cierre_sabado > horario_apertura)
);

-- Clientes y empleados comparten tabla: los diferencia el rol.
-- Empleados = VENDEDOR, INSTRUCTOR o ADMIN. Clientes = CLIENTE.
CREATE TABLE usuario (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(80)  NOT NULL,
    apellido       VARCHAR(80)  NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    rol            VARCHAR(20)  NOT NULL
        CHECK (rol IN ('CLIENTE', 'VENDEDOR', 'ADMIN', 'INSTRUCTOR')),
    telefono       VARCHAR(30),
    sucursal_id    INTEGER REFERENCES sucursal(id),
    activo         BOOLEAN   NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMP NOT NULL DEFAULT now(),
    -- Vendedores e instructores trabajan en una sucursal.
    CHECK (rol NOT IN ('VENDEDOR', 'INSTRUCTOR') OR sucursal_id IS NOT NULL)
);

CREATE TABLE vehiculo_demo (
    id           SERIAL PRIMARY KEY,
    version_id   INTEGER NOT NULL REFERENCES version(id),
    sucursal_id  INTEGER NOT NULL REFERENCES sucursal(id),
    patente      VARCHAR(10) NOT NULL UNIQUE,
    disponible   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE turno_test_drive (
    id                    SERIAL PRIMARY KEY,
    cliente_id            INTEGER NOT NULL REFERENCES usuario(id),
    vehiculo_demo_id      INTEGER NOT NULL REFERENCES vehiculo_demo(id),
    vendedor_id           INTEGER NOT NULL REFERENCES usuario(id),
    fecha                 DATE NOT NULL,
    hora_inicio           TIME NOT NULL,
    hora_fin              TIME NOT NULL,
    estado                VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'AUSENTE')),
    observaciones         VARCHAR(500),
    recordatorio_enviado  BOOLEAN   NOT NULL DEFAULT FALSE,
    creado_en             TIMESTAMP NOT NULL DEFAULT now(),
    CHECK (hora_fin > hora_inicio)
);

CREATE TABLE clase_manejo (
    id                    SERIAL PRIMARY KEY,
    cliente_id            INTEGER NOT NULL REFERENCES usuario(id),
    instructor_id         INTEGER NOT NULL REFERENCES usuario(id),
    sucursal_id           INTEGER NOT NULL REFERENCES sucursal(id),
    fecha                 DATE NOT NULL,
    hora_inicio           TIME NOT NULL,
    hora_fin              TIME NOT NULL,
    transmision           VARCHAR(20) NOT NULL DEFAULT 'MANUAL'
        CHECK (transmision IN ('MANUAL', 'AUTOMATICA')),
    estado                VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'AUSENTE')),
    observaciones         VARCHAR(500),
    recordatorio_enviado  BOOLEAN   NOT NULL DEFAULT FALSE,
    creado_en             TIMESTAMP NOT NULL DEFAULT now(),
    CHECK (hora_fin > hora_inicio)
);

-- =====================================================================
-- REGLAS ANTI-SUPERPOSICIÓN (índices únicos parciales)
-- En la Segunda Entrega era UNIQUE (vehiculo_demo_id, fecha, hora_inicio).
-- Problema: un turno CANCELADO seguía "ocupando" el horario para siempre.
-- Con un índice parcial (WHERE estado <> 'CANCELADO') la base garantiza que
-- no haya dos turnos activos iguales, y al cancelar el horario se libera.
-- =====================================================================

-- Un vehículo demo no puede tener dos test drives activos en el mismo horario.
CREATE UNIQUE INDEX uq_turno_vehiculo_horario
    ON turno_test_drive (vehiculo_demo_id, fecha, hora_inicio)
    WHERE estado <> 'CANCELADO';

-- Un vendedor no puede atender dos test drives a la vez.
CREATE UNIQUE INDEX uq_turno_vendedor_horario
    ON turno_test_drive (vendedor_id, fecha, hora_inicio)
    WHERE estado <> 'CANCELADO';

-- Un instructor no puede dar dos clases a la vez.
CREATE UNIQUE INDEX uq_clase_instructor_horario
    ON clase_manejo (instructor_id, fecha, hora_inicio)
    WHERE estado <> 'CANCELADO';

-- =====================================================================
-- ÍNDICES PRINCIPALES
-- Postgres no indexa automáticamente las FK (solo PK y UNIQUE).
-- Se indexan las columnas usadas en joins y búsquedas frecuentes.
-- =====================================================================

CREATE INDEX idx_modelo_marca            ON modelo(marca_id);
CREATE INDEX idx_version_modelo          ON version(modelo_id);
CREATE INDEX idx_imagen_modelo           ON imagen_modelo(modelo_id);
CREATE INDEX idx_color_modelo            ON color_modelo(modelo_id);
CREATE INDEX idx_vehiculo_demo_version   ON vehiculo_demo(version_id);
CREATE INDEX idx_vehiculo_demo_sucursal  ON vehiculo_demo(sucursal_id);
CREATE INDEX idx_usuario_sucursal        ON usuario(sucursal_id);
CREATE INDEX idx_usuario_rol             ON usuario(rol);

CREATE INDEX idx_turno_cliente           ON turno_test_drive(cliente_id);
CREATE INDEX idx_turno_vendedor_fecha    ON turno_test_drive(vendedor_id, fecha);
CREATE INDEX idx_turno_fecha_estado      ON turno_test_drive(fecha, estado);

CREATE INDEX idx_clase_cliente           ON clase_manejo(cliente_id);
CREATE INDEX idx_clase_instructor_fecha  ON clase_manejo(instructor_id, fecha);
CREATE INDEX idx_clase_sucursal_fecha    ON clase_manejo(sucursal_id, fecha);
