-- =====================================================================
-- Km0 Automotores — Migración V5: más modelos y un instructor
-- Suma la marca Mercedes-Benz y 6 modelos (Toyota SW4, Audi A5 Sportback,
-- Mercedes-Benz Clase C, GLA y GLC, Volkswagen Virtus) con sus versiones,
-- colores y unidades para test drive, y un instructor en Córdoba Norte.
-- Precios y fichas son de REFERENCIA (proyecto académico).
--
-- No usa IDs fijos: busca marcas, modelos y sucursales por nombre, así no choca
-- con lo que se haya cargado desde el panel de administración. Los ON CONFLICT
-- evitan duplicados si algo ya existía con el mismo nombre.
-- Las fotos se agregan con scripts/fotos (R__fotos_modelos.sql); hasta entonces
-- la ficha muestra la silueta del tipo de carrocería.
-- =====================================================================

INSERT INTO marca (nombre) VALUES ('Mercedes-Benz')
ON CONFLICT (nombre) DO NOTHING;

-- ---------------------------------------------------------------- modelos
INSERT INTO modelo (marca_id, nombre, tipo_carroceria, anio, descripcion, destacado)
SELECT ma.id, m.nombre, m.tipo, 2026, m.descripcion, m.destacado
FROM (VALUES
  ('Toyota', 'SW4', 'SUV',
   'El SUV de siete plazas hecho sobre la base de la Hilux. Chasis de largueros, tracción 4x4 con reductora y la versión GR-Sport con 224 CV.', TRUE),
  ('Audi', 'A5 Sportback', 'SEDAN',
   'Coupé de cuatro puertas con portón trasero: línea baja, baúl amplio y la versión S5 de 367 CV con tracción quattro.', FALSE),
  ('Mercedes-Benz', 'Clase C', 'SEDAN',
   'El sedán mediano de Mercedes-Benz. Tracción trasera, caja automática de 9 marchas e interior con pantalla vertical central.', TRUE),
  ('Mercedes-Benz', 'GLA', 'SUV',
   'SUV compacto premium, cómodo para la ciudad. Versión de entrada con caja de doble embrague y una AMG Line con tracción integral.', FALSE),
  ('Mercedes-Benz', 'GLC', 'SUV',
   'SUV mediano de Mercedes-Benz, de nueva generación, con tracción 4MATIC de serie y mucho espacio para viajar.', FALSE),
  ('Volkswagen', 'Virtus', 'SEDAN',
   'Sedán compacto fabricado en la región, con uno de los baúles más grandes del segmento (521 litros) y motores turbo.', FALSE)
) AS m(marca, nombre, tipo, descripcion, destacado)
JOIN marca ma ON ma.nombre = m.marca
ON CONFLICT (marca_id, nombre) DO NOTHING;

-- ---------------------------------------------------------------- versiones
INSERT INTO version (modelo_id, nombre_version, precio, motor, potencia_cv, transmision, combustible, traccion, puertas, plazas)
SELECT mo.id, v.nombre_version, v.precio, v.motor, v.potencia, v.transmision, v.combustible, v.traccion, v.puertas, v.plazas
FROM (VALUES
  ('Toyota', 'SW4', 'SRX 2.8 TDI 4x4 AT', 78500000.00, '2.8 turbodiésel', 204, 'Automática 6 vel.', 'DIESEL', '4x4', 5, 7),
  ('Toyota', 'SW4', 'Diamond 2.8 TDI 4x4 AT', 84200000.00, '2.8 turbodiésel', 204, 'Automática 6 vel.', 'DIESEL', '4x4', 5, 7),
  ('Toyota', 'SW4', 'GR-Sport 2.8 TDI 4x4 AT', 89900000.00, '2.8 turbodiésel', 224, 'Automática 6 vel.', 'DIESEL', '4x4', 5, 7),
  ('Audi', 'A5 Sportback', '40 TFSI S tronic', 88000000.00, '2.0 TFSI', 204, 'S tronic 7 vel.', 'NAFTA', 'Delantera', 5, 5),
  ('Audi', 'A5 Sportback', '45 TFSI quattro S line', 102000000.00, '2.0 TFSI', 265, 'S tronic 7 vel.', 'NAFTA', 'Integral quattro', 5, 5),
  ('Audi', 'A5 Sportback', 'S5 3.0 TFSI quattro', 128000000.00, '3.0 V6 TFSI', 367, 'Tiptronic 8 vel.', 'NAFTA', 'Integral quattro', 5, 5),
  ('Mercedes-Benz', 'Clase C', 'C 200 Avantgarde', 82500000.00, '1.5 turbo con asistencia eléctrica', 204, '9G-TRONIC 9 vel.', 'NAFTA', 'Trasera', 4, 5),
  ('Mercedes-Benz', 'Clase C', 'C 300 AMG Line', 97000000.00, '2.0 turbo con asistencia eléctrica', 258, '9G-TRONIC 9 vel.', 'NAFTA', 'Trasera', 4, 5),
  ('Mercedes-Benz', 'GLA', 'GLA 200 Progressive', 70500000.00, '1.3 turbo', 163, '7G-DCT 7 vel.', 'NAFTA', 'Delantera', 5, 5),
  ('Mercedes-Benz', 'GLA', 'GLA 250 4MATIC AMG Line', 84000000.00, '2.0 turbo', 224, '8G-DCT 8 vel.', 'NAFTA', 'Integral 4MATIC', 5, 5),
  ('Mercedes-Benz', 'GLC', 'GLC 300 4MATIC', 115000000.00, '2.0 turbo con asistencia eléctrica', 258, '9G-TRONIC 9 vel.', 'NAFTA', 'Integral 4MATIC', 5, 5),
  ('Mercedes-Benz', 'GLC', 'GLC 300 4MATIC AMG Line', 124500000.00, '2.0 turbo con asistencia eléctrica', 258, '9G-TRONIC 9 vel.', 'NAFTA', 'Integral 4MATIC', 5, 5),
  ('Volkswagen', 'Virtus', 'Trendline 170 TSI MT', 29500000.00, '1.0 TSI', 116, 'Manual 6 vel.', 'NAFTA', 'Delantera', 4, 5),
  ('Volkswagen', 'Virtus', 'Comfortline 170 TSI AT', 32900000.00, '1.0 TSI', 116, 'Automática 6 vel.', 'NAFTA', 'Delantera', 4, 5),
  ('Volkswagen', 'Virtus', 'Highline 170 TSI AT', 35400000.00, '1.0 TSI', 116, 'Automática 6 vel.', 'NAFTA', 'Delantera', 4, 5),
  ('Volkswagen', 'Virtus', 'Exclusive 250 TSI AT', 39800000.00, '1.4 TSI', 150, 'Automática 6 vel.', 'NAFTA', 'Delantera', 4, 5)
) AS v(marca, modelo, nombre_version, precio, motor, potencia, transmision, combustible, traccion, puertas, plazas)
JOIN marca ma ON ma.nombre = v.marca
JOIN modelo mo ON mo.marca_id = ma.id AND mo.nombre = v.modelo
ON CONFLICT (modelo_id, nombre_version) DO NOTHING;

-- ---------------------------------------------------------------- colores
-- color_modelo no tiene clave única: se cargan solo si el modelo todavía no tiene colores.
INSERT INTO color_modelo (modelo_id, nombre, hex)
SELECT mo.id, c.nombre, c.hex
FROM (VALUES
  ('Toyota', 'SW4', 'Blanco perlado', '#F2F1EC'),
  ('Toyota', 'SW4', 'Gris plata', '#A9AEB4'),
  ('Toyota', 'SW4', 'Gris oscuro', '#4A4F55'),
  ('Toyota', 'SW4', 'Bordó', '#5E1A22'),
  ('Toyota', 'SW4', 'Negro', '#16181B'),
  ('Audi', 'A5 Sportback', 'Blanco glaciar', '#F3F3F1'),
  ('Audi', 'A5 Sportback', 'Gris Daytona', '#4C5055'),
  ('Audi', 'A5 Sportback', 'Azul Navarra', '#1E2F55'),
  ('Audi', 'A5 Sportback', 'Verde distrito', '#3B4A3F'),
  ('Audi', 'A5 Sportback', 'Negro', '#16181B'),
  ('Mercedes-Benz', 'Clase C', 'Blanco polar', '#F4F4F2'),
  ('Mercedes-Benz', 'Clase C', 'Plata high-tech', '#B3B7BC'),
  ('Mercedes-Benz', 'Clase C', 'Gris grafito', '#4E5258'),
  ('Mercedes-Benz', 'Clase C', 'Azul espectral', '#1D3557'),
  ('Mercedes-Benz', 'Clase C', 'Negro obsidiana', '#121417'),
  ('Mercedes-Benz', 'GLA', 'Blanco polar', '#F4F4F2'),
  ('Mercedes-Benz', 'GLA', 'Gris montaña', '#6C7177'),
  ('Mercedes-Benz', 'GLA', 'Rojo jacinto', '#7A1620'),
  ('Mercedes-Benz', 'GLA', 'Negro cósmico', '#16181B'),
  ('Mercedes-Benz', 'GLC', 'Blanco polar', '#F4F4F2'),
  ('Mercedes-Benz', 'GLC', 'Plata high-tech', '#B3B7BC'),
  ('Mercedes-Benz', 'GLC', 'Azul noche', '#1B2638'),
  ('Mercedes-Benz', 'GLC', 'Negro obsidiana', '#121417'),
  ('Volkswagen', 'Virtus', 'Blanco', '#F1F1EE'),
  ('Volkswagen', 'Virtus', 'Gris plata', '#A9AEB4'),
  ('Volkswagen', 'Virtus', 'Gris platino', '#7E8389'),
  ('Volkswagen', 'Virtus', 'Rojo', '#A3212A'),
  ('Volkswagen', 'Virtus', 'Azul', '#2C4F86'),
  ('Volkswagen', 'Virtus', 'Negro', '#16181B')
) AS c(marca, modelo, nombre, hex)
JOIN marca ma ON ma.nombre = c.marca
JOIN modelo mo ON mo.marca_id = ma.id AND mo.nombre = c.modelo
WHERE NOT EXISTS (SELECT 1 FROM color_modelo cm WHERE cm.modelo_id = mo.id);

-- ---------------------------------------------------------------- unidades para test drive
INSERT INTO vehiculo_demo (version_id, sucursal_id, patente)
SELECT ve.id, su.id, u.patente
FROM (VALUES
  ('Toyota', 'SW4', 'Diamond 2.8 TDI 4x4 AT', 'Córdoba Centro', 'AI301KM'),
  ('Toyota', 'SW4', 'GR-Sport 2.8 TDI 4x4 AT', 'Córdoba Norte', 'AI302KM'),
  ('Toyota', 'SW4', 'SRX 2.8 TDI 4x4 AT', 'Villa Carlos Paz', 'AI303KM'),
  ('Audi', 'A5 Sportback', '40 TFSI S tronic', 'Córdoba Centro', 'AI304KM'),
  ('Audi', 'A5 Sportback', '45 TFSI quattro S line', 'Córdoba Norte', 'AI305KM'),
  ('Mercedes-Benz', 'Clase C', 'C 200 Avantgarde', 'Córdoba Centro', 'AI306KM'),
  ('Mercedes-Benz', 'Clase C', 'C 300 AMG Line', 'Córdoba Norte', 'AI307KM'),
  ('Mercedes-Benz', 'GLA', 'GLA 200 Progressive', 'Córdoba Norte', 'AI308KM'),
  ('Mercedes-Benz', 'GLC', 'GLC 300 4MATIC', 'Córdoba Centro', 'AI309KM'),
  ('Volkswagen', 'Virtus', 'Highline 170 TSI AT', 'Córdoba Centro', 'AI310KM'),
  ('Volkswagen', 'Virtus', 'Comfortline 170 TSI AT', 'Córdoba Norte', 'AI311KM'),
  ('Volkswagen', 'Virtus', 'Trendline 170 TSI MT', 'Villa Carlos Paz', 'AI312KM')
) AS u(marca, modelo, nombre_version, sucursal, patente)
JOIN marca ma ON ma.nombre = u.marca
JOIN modelo mo ON mo.marca_id = ma.id AND mo.nombre = u.modelo
JOIN version ve ON ve.modelo_id = mo.id AND ve.nombre_version = u.nombre_version
JOIN sucursal su ON su.nombre = u.sucursal
ON CONFLICT (patente) DO NOTHING;

-- ---------------------------------------------------------------- instructor en Córdoba Norte
-- Contraseña Demo1234 (mismo hash BCrypt que los demás usuarios de ejemplo).
INSERT INTO usuario (nombre, apellido, email, password_hash, rol, telefono, sucursal_id)
SELECT 'Gabriel', 'Ortiz', 'gabriel.ortiz@km0.com.ar',
       '$2a$10$mxxFMF510fkfOXr.2x4t6uTxoeD3TPPwL9HFgafaxNU6x2hluUclq', 'INSTRUCTOR', '351 555-0204', su.id
FROM sucursal su
WHERE su.nombre = 'Córdoba Norte'
ON CONFLICT (email) DO NOTHING;
