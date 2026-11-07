-- =====================================================================
-- V4 · Solicitudes de compra
-- El cliente indica qué versión quiere, color, forma de pago y si entrega un usado.
-- No se cobra nada online: se asigna un vendedor que lo contacta y el sistema
-- genera un presupuesto orientativo. Es el paso siguiente al test drive.
-- =====================================================================

CREATE TABLE solicitud_compra (
    id                 SERIAL PRIMARY KEY,
    cliente_id         INTEGER       NOT NULL REFERENCES usuario(id),
    version_id         INTEGER       NOT NULL REFERENCES version(id),
    sucursal_id        INTEGER       NOT NULL REFERENCES sucursal(id),
    vendedor_id        INTEGER       NOT NULL REFERENCES usuario(id),
    -- Copia del nombre del color: si el admin borra el color del catálogo, la solicitud lo conserva
    color              VARCHAR(60),
    forma_pago         VARCHAR(20)   NOT NULL
        CHECK (forma_pago IN ('CONTADO', 'FINANCIADO', 'PLAN_AHORRO')),
    -- Precio y condiciones del momento de la solicitud (el precio de lista puede cambiar después)
    precio_lista       NUMERIC(14,2) NOT NULL CHECK (precio_lista > 0),
    anticipo           NUMERIC(14,2) CHECK (anticipo >= 0),
    cuotas             INTEGER       CHECK (cuotas > 0),
    tna_referencia     NUMERIC(5,2)  CHECK (tna_referencia >= 0),
    cuota_estimada     NUMERIC(14,2) CHECK (cuota_estimada > 0),
    entrega_usado      BOOLEAN       NOT NULL DEFAULT FALSE,
    usado_descripcion  VARCHAR(200),
    comentario         VARCHAR(500),
    estado             VARCHAR(20)   NOT NULL DEFAULT 'NUEVA'
        CHECK (estado IN ('NUEVA', 'CONTACTADA', 'RESERVADA', 'VENDIDA', 'DESCARTADA')),
    creado_en          TIMESTAMP     NOT NULL DEFAULT now(),
    actualizado_en     TIMESTAMP     NOT NULL DEFAULT now(),
    -- Financiado: tiene que tener anticipo, cuotas y cuota calculada; anticipo menor al precio
    CHECK (forma_pago <> 'FINANCIADO'
           OR (anticipo IS NOT NULL AND cuotas IS NOT NULL AND cuota_estimada IS NOT NULL AND anticipo < precio_lista)),
    CHECK (NOT entrega_usado OR usado_descripcion IS NOT NULL)
);

-- Un cliente no puede tener dos solicitudes abiertas de la misma versión
-- (misma idea que los turnos: índice único parcial que ignora las cerradas).
CREATE UNIQUE INDEX uq_solicitud_abierta
    ON solicitud_compra (cliente_id, version_id)
    WHERE estado IN ('NUEVA', 'CONTACTADA', 'RESERVADA');

CREATE INDEX idx_solicitud_cliente          ON solicitud_compra (cliente_id);
CREATE INDEX idx_solicitud_vendedor_estado  ON solicitud_compra (vendedor_id, estado);
CREATE INDEX idx_solicitud_estado_fecha     ON solicitud_compra (estado, creado_en);
CREATE INDEX idx_solicitud_version          ON solicitud_compra (version_id);
CREATE INDEX idx_solicitud_sucursal         ON solicitud_compra (sucursal_id);

-- ---------------------------------------------------------------------
-- Solicitudes de ejemplo (para que el panel del vendedor y del admin no arranquen vacíos)
-- La cuota se calcula con sistema francés: (precio - anticipo) * i / (1 - (1 + i)^-n), i = TNA / 12 / 100
-- ---------------------------------------------------------------------
INSERT INTO solicitud_compra (cliente_id, version_id, sucursal_id, vendedor_id, color, forma_pago,
                              precio_lista, anticipo, cuotas, tna_referencia, cuota_estimada,
                              entrega_usado, usado_descripcion, comentario, estado, creado_en, actualizado_en)
SELECT c.id, v.id, s.id, ve.id, d.color, d.forma_pago, v.precio,
       CASE WHEN d.forma_pago = 'FINANCIADO' THEN round(v.precio * d.anticipo_pct / 100, 2) END,
       CASE WHEN d.forma_pago = 'FINANCIADO' THEN d.cuotas END,
       CASE WHEN d.forma_pago = 'FINANCIADO' THEN 39.00 END,
       CASE WHEN d.forma_pago = 'FINANCIADO' THEN round(
           (v.precio - round(v.precio * d.anticipo_pct / 100, 2)) * (39.00 / 1200)
           / (1 - power(1 + 39.00 / 1200, -d.cuotas)), 2) END,
       d.usado IS NOT NULL, d.usado, d.comentario, d.estado,
       now() - make_interval(days => d.hace_dias), now() - make_interval(days => greatest(d.hace_dias - 2, 0))
FROM (VALUES
    ('cliente@example.com',  5, 'Córdoba Centro', 'sofia.rinaldi@km0.com.ar',  'Gris plata',   'FINANCIADO',  40, 36, NULL, 'Hice el test drive y me encantó. ¿Tienen entrega inmediata?', 'CONTACTADA', 6),
    ('cliente@example.com', 30, 'Córdoba Centro', 'martin.ferreyra@km0.com.ar', 'Blanco',       'CONTADO',     NULL, NULL, 'Chevrolet Onix LT 2019, 62.000 km', NULL, 'NUEVA', 1),
    ('natalia.ojeda@example.com', 26, 'Córdoba Centro', 'martin.ferreyra@km0.com.ar', 'Azul Portimao', 'FINANCIADO', 50, 24, NULL, NULL, 'RESERVADA', 12),
    ('ivan.barrera@example.com', 18, 'Córdoba Norte', 'diego.quiroga@km0.com.ar', NULL, 'PLAN_AHORRO', NULL, NULL, NULL, 'Me interesa el plan 70/30.', 'NUEVA', 0),
    ('milagros.romero@example.com', 8, 'Villa Carlos Paz', 'pablo.ledesma@km0.com.ar', 'Negro', 'CONTADO', NULL, NULL, 'Toyota Hilux SRV 2018, 110.000 km', NULL, 'VENDIDA', 25),
    ('lorena.vega@example.com', 11, 'Córdoba Norte', 'lucia.bustos@km0.com.ar', 'Rojo', 'FINANCIADO', 30, 48, NULL, NULL, 'DESCARTADA', 18)
) AS d(email, version_id, sucursal, vendedor, color, forma_pago, anticipo_pct, cuotas, usado, comentario, estado, hace_dias)
JOIN usuario c   ON c.email = d.email
JOIN version v   ON v.id = d.version_id
JOIN sucursal s  ON s.nombre = d.sucursal
JOIN usuario ve  ON ve.email = d.vendedor;
