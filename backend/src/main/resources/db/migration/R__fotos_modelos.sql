-- Fotos reales de los modelos, descargadas de Wikimedia Commons con scripts/fotos/descargar-fotos.mjs.
-- Migración REPETIBLE de Flyway (prefijo R__): se vuelve a aplicar sola cada vez que cambia este archivo.
-- No editar a mano: volver a correr el script.
--
-- Reemplaza las fotos de ejemplo (enlaces a Wikimedia) y las de una corrida anterior del script.
-- Las fotos que el administrador haya agregado con otra URL no se tocan.

DELETE FROM imagen_modelo WHERE url LIKE '/fotos/%' OR url LIKE 'https://upload.wikimedia.org/%';

-- Toyota Corolla
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/toyota-corolla-1.jpg', 'https://commons.wikimedia.org/wiki/File:Toyota_Corolla_sedan_E210_hydrid.jpg', 'Mateusmatsuda · CC BY 4.0', 0),
  ('/fotos/toyota-corolla-2.jpg', 'https://commons.wikimedia.org/wiki/File:TOYOTA_COROLLA_SEDAN_(E210)_China_(9).jpg', 'Dinkun Chen · CC BY-SA 4.0', 1),
  ('/fotos/toyota-corolla-3.jpg', 'https://commons.wikimedia.org/wiki/File:18_Toyota_Corolla_(E210)_back.jpg', 'Benespit · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Toyota' AND m.nombre = 'Corolla';

-- Toyota Corolla Cross
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/toyota-corolla-cross-1.jpg', 'https://commons.wikimedia.org/wiki/File:Toyota_Corolla_Cross_Hybrid_1X7A6348.jpg', 'Alexander Migl · CC BY-SA 4.0', 0),
  ('/fotos/toyota-corolla-cross-2.jpg', 'https://commons.wikimedia.org/wiki/File:2020_Toyota_Corolla_Cross_-_Front.jpg', 'Areaseven · CC BY-SA 4.0', 1),
  ('/fotos/toyota-corolla-cross-3.jpg', 'https://commons.wikimedia.org/wiki/File:2020_Toyota_Corolla_Cross_-_Rear.jpg', 'Areaseven · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Toyota' AND m.nombre = 'Corolla Cross';

-- Toyota Hilux
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/toyota-hilux-1.jpg', 'https://commons.wikimedia.org/wiki/File:Toyota_HiLux_GR_Sport_1X7A7281.jpg', 'Alexander-93 · CC BY-SA 4.0', 0),
  ('/fotos/toyota-hilux-2.jpg', 'https://commons.wikimedia.org/wiki/File:Toyota_Hilux_2.8_GR_Sport_4x4_2024_(1).jpg', 'Ethan Llamas · CC BY-SA 4.0', 1),
  ('/fotos/toyota-hilux-3.jpg', 'https://commons.wikimedia.org/wiki/File:2021_Toyota_Hilux_Revo_GR_Sport_Double-Cab_2.8_4x4.jpg', 'Chanokchon · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Toyota' AND m.nombre = 'Hilux';

-- Toyota Yaris
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/toyota-yaris-1.jpg', 'https://commons.wikimedia.org/wiki/File:2023_Toyota_Yaris_Premium.jpg', 'Chanokchon · CC BY-SA 4.0', 0),
  ('/fotos/toyota-yaris-2.jpg', 'https://commons.wikimedia.org/wiki/File:2023_Toyota_Yaris_Premium_S.jpg', 'Chanokchon · CC BY-SA 4.0', 1),
  ('/fotos/toyota-yaris-3.jpg', 'https://commons.wikimedia.org/wiki/File:2023_Toyota_Yaris_Premium_S_(Rear).jpg', 'Chanokchon · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Toyota' AND m.nombre = 'Yaris';

-- Volkswagen Amarok
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/vw-amarok-1.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_Amarok_Mk2_1X7A0807.jpg', 'Alexander-93 · CC BY-SA 4.0', 0),
  ('/fotos/vw-amarok-2.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_Amarok_Mk2_1X7A0808.jpg', 'Alexander-93 · CC BY-SA 4.0', 1),
  ('/fotos/vw-amarok-3.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_Amarok_II_V6_1X7A7384.jpg', 'Alexander-93 · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Volkswagen' AND m.nombre = 'Amarok';

-- Volkswagen Taos
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/vw-taos-1.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_Taos_1X7A6748.jpg', 'Alexander-93 · CC BY-SA 4.0', 0),
  ('/fotos/vw-taos-2.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_Taos_1X7A6750.jpg', 'Alexander-93 · CC BY-SA 4.0', 1),
  ('/fotos/vw-taos-3.jpg', 'https://commons.wikimedia.org/wiki/File:2022_Volkswagen_Taos_1.5T_SE_in_Cornflower_Blue,_front_left.jpg', 'Mr.choppers · CC BY-SA 3.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Volkswagen' AND m.nombre = 'Taos';

-- Volkswagen T-Cross
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/vw-t-cross-1.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_T-Cross_(2023)_1X7A1967.jpg', 'Alexander-93 · CC BY-SA 4.0', 0),
  ('/fotos/vw-t-cross-2.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_T-Cross_(2023)_1X7A2499.jpg', 'Alexander-93 · CC BY-SA 4.0', 1),
  ('/fotos/vw-t-cross-3.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_T-Cross_IAA_2023_1X7A0155.jpg', 'Alexander-93 · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Volkswagen' AND m.nombre = 'T-Cross';

-- Volkswagen Polo
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/vw-polo-1.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_Polo_VI_(2021)_IMG_5700.jpg', 'Alexander Migl · CC BY-SA 4.0', 0),
  ('/fotos/vw-polo-2.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_Polo_VI_(2021)_IMG_5732.jpg', 'Alexander Migl · CC BY-SA 4.0', 1),
  ('/fotos/vw-polo-3.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_Polo_VI_(2021)_IMG_5319.jpg', 'Alexander Migl · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Volkswagen' AND m.nombre = 'Polo';

-- Audi A3 Sedan
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/audi-a3-sedan-1.jpg', 'https://commons.wikimedia.org/wiki/File:2024_Audi_A3_8Y_Sedan_IMG_1019.jpg', 'Alexander-93 · CC BY-SA 4.0', 0),
  ('/fotos/audi-a3-sedan-2.jpg', 'https://commons.wikimedia.org/wiki/File:Audi_A3_8Y_Sedan_IMG_5936.jpg', 'Alexander Migl · CC BY-SA 4.0', 1),
  ('/fotos/audi-a3-sedan-3.jpg', 'https://commons.wikimedia.org/wiki/File:Audi_A3_8Y_Sedan_IMG_4928.jpg', 'Alexander Migl · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Audi' AND m.nombre = 'A3 Sedan';

-- Audi Q3
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/audi-q3-1.jpg', 'https://commons.wikimedia.org/wiki/File:Audi_Q3_F3_DSC_7497.jpg', 'Alexander Migl · CC BY-SA 4.0', 0),
  ('/fotos/audi-q3-2.jpg', 'https://commons.wikimedia.org/wiki/File:Audi_Q3_F3_white_(1).jpg', 'Damian B Oh · CC BY-SA 4.0', 1),
  ('/fotos/audi-q3-3.jpg', 'https://commons.wikimedia.org/wiki/File:2019_Audi_Q3_S_Line_45_TFSi_Quattro_2.0_Front.jpg', 'Vauxford · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Audi' AND m.nombre = 'Q3';

-- BMW Serie 3
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/bmw-serie-3-1.jpg', 'https://commons.wikimedia.org/wiki/File:BMW_G20_330i_in_blue.jpg', 'Damian B Oh · CC BY-SA 4.0', 0),
  ('/fotos/bmw-serie-3-2.jpg', 'https://commons.wikimedia.org/wiki/File:2019_BMW_330i_M_Sport_2.0_Front.jpg', 'Vauxford · CC BY-SA 4.0', 1),
  ('/fotos/bmw-serie-3-3.jpg', 'https://commons.wikimedia.org/wiki/File:BMW_330i_G20_Black_3.jpg', 'Damian B Oh · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'BMW' AND m.nombre = 'Serie 3';

-- BMW X1
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/bmw-x1-1.jpg', 'https://commons.wikimedia.org/wiki/File:BMW_U11_1X7A6187.jpg', 'Alexander Migl · CC BY-SA 4.0', 0),
  ('/fotos/bmw-x1-2.jpg', 'https://commons.wikimedia.org/wiki/File:BMW_X1_xDrive20i_(U11)_rear.jpg', 'Tokumeigakarinoaoshima · CC BY-SA 4.0', 1),
  ('/fotos/bmw-x1-3.jpg', 'https://commons.wikimedia.org/wiki/File:2023-02_BMW_U11-X1_s18d_blue-green.jpg', 'Wikisympathisant · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'BMW' AND m.nombre = 'X1';

-- Chevrolet Onix
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/chevrolet-onix-1.jpg', 'https://commons.wikimedia.org/wiki/File:Chevrolet_Onix_II_front_Brazil.jpg', 'Heduardo55 · CC0', 0),
  ('/fotos/chevrolet-onix-2.jpg', 'https://commons.wikimedia.org/wiki/File:Chevrolet_Onix_(second_generation,_front_view).jpg', 'Chevrolet México · CC BY 3.0', 1),
  ('/fotos/chevrolet-onix-3.jpg', 'https://commons.wikimedia.org/wiki/File:Chevrolet_Onix_(second_generation,_rear_view).jpg', 'Chevrolet México · CC BY 3.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Chevrolet' AND m.nombre = 'Onix';

-- Chevrolet Tracker
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/chevrolet-tracker-1.jpg', 'https://commons.wikimedia.org/wiki/File:2022_Chevrolet_Tracker_1.2_Turbo_LS.jpg', 'RL GNZLZ · CC BY-SA 2.0', 0),
  ('/fotos/chevrolet-tracker-2.jpg', 'https://commons.wikimedia.org/wiki/File:Chevrolet_Tracker_2021_(rear).png', 'Autosdeprimera · CC BY 3.0', 1),
  ('/fotos/chevrolet-tracker-3.jpg', 'https://commons.wikimedia.org/wiki/File:Chevrolet_Tracker,_Front_Right,_05-12-2021.jpg', 'SsmIntrigue · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Chevrolet' AND m.nombre = 'Tracker';

-- Chevrolet S10
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/chevrolet-s10-prensa-1.jpg', NULL, 'Chevrolet · foto de prensa', 0),
  ('/fotos/chevrolet-s10-1.jpg', 'https://commons.wikimedia.org/wiki/File:Brazilian_2012_All-New_Chevy_S10.jpg', 'Simoloko · CC BY-SA 3.0', 1)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Chevrolet' AND m.nombre = 'S10';

-- Toyota SW4
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/toyota-sw4-1.jpg', 'https://commons.wikimedia.org/wiki/File:Toyota_Fortuner_(AN160)_Front.jpg', 'M.rJirapat · CC BY-SA 4.0', 0),
  ('/fotos/toyota-sw4-2.jpg', 'https://commons.wikimedia.org/wiki/File:2021_Toyota_Fortuner_SRZ_2.7_4x2_(Indonesia)_front_view_01.jpg', 'Andra Febrian · CC BY-SA 4.0', 1),
  ('/fotos/toyota-sw4-3.jpg', 'https://commons.wikimedia.org/wiki/File:Toyota_Fortuner_(AN160)_rear.jpg', 'M.rJirapat · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Toyota' AND m.nombre = 'SW4';

-- Audi A5 Sportback
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/audi-a5-sportback-1.jpg', 'https://commons.wikimedia.org/wiki/File:Audi_A5_Sportback_F5_FL_IMG_6127.jpg', 'Alexander Migl · CC BY-SA 4.0', 0),
  ('/fotos/audi-a5-sportback-2.jpg', 'https://commons.wikimedia.org/wiki/File:AUDI_A5_SPORTBACK_F5_China.jpg', 'Dinkun Chen · CC BY-SA 4.0', 1),
  ('/fotos/audi-a5-sportback-3.jpg', 'https://commons.wikimedia.org/wiki/File:AUDI_A5_SPORTBACK_F5_China_(2).jpg', 'Dinkun Chen · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Audi' AND m.nombre = 'A5 Sportback';

-- Mercedes-Benz Clase C
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/mercedes-benz-clase-c-1.jpg', 'https://commons.wikimedia.org/wiki/File:2024_Mercedes-Benz_W206_C180_Avantgarde_in_Mojave_Silver,_front_right,_07-10-2024.jpg', 'Ethan Llamas · CC BY-SA 4.0', 0),
  ('/fotos/mercedes-benz-clase-c-2.jpg', 'https://commons.wikimedia.org/wiki/File:2024_Mercedes-Benz_W206_C180_Avantgarde_in_Mojave_Silver,_rear_right,_07-10-2024.jpg', 'Ethan Llamas · CC BY-SA 4.0', 1),
  ('/fotos/mercedes-benz-clase-c-3.jpg', 'https://commons.wikimedia.org/wiki/File:Mercedes-Benz_W206_IMG_5796.jpg', 'Alexander Migl · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Mercedes-Benz' AND m.nombre = 'Clase C';

-- Mercedes-Benz GLA
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/mercedes-benz-gla-1.jpg', 'https://commons.wikimedia.org/wiki/File:Mercedes-Benz_GLA_200d_4MATIC_(H247)_front.jpg', 'Tokumeigakarinoaoshima · CC BY-SA 4.0', 0),
  ('/fotos/mercedes-benz-gla-2.jpg', 'https://commons.wikimedia.org/wiki/File:Mercedes-AMG_GLA_35_4MATIC_(H247)_Auto_Zuerich_2021_IMG_0269.jpg', 'Alexander Migl · CC BY-SA 4.0', 1),
  ('/fotos/mercedes-benz-gla-3.jpg', 'https://commons.wikimedia.org/wiki/File:Mercedes-Benz_GLA_200_d_4MATIC_Night_Edition_(H247)_front.jpg', 'Tokumeigakarinoaoshima · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Mercedes-Benz' AND m.nombre = 'GLA';

-- Mercedes-Benz GLC
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/mercedes-benz-glc-1.jpg', 'https://commons.wikimedia.org/wiki/File:Mercedes-Benz_GLC_220_d_4MATIC_(X254)_front.jpg', 'Tokumeigakarinoaoshima · CC BY-SA 4.0', 0),
  ('/fotos/mercedes-benz-glc-2.jpg', 'https://commons.wikimedia.org/wiki/File:2023_Mercedes-Benz_GLC-Class_GLC220d_4MATIC_Avantgarde.jpg', 'Chanokchon · CC BY-SA 4.0', 1),
  ('/fotos/mercedes-benz-glc-3.jpg', 'https://commons.wikimedia.org/wiki/File:Mercedes-Benz_GLC_220d_4MATIC_(X254)_front.jpg', 'Tokumeigakarinoaoshima · CC BY-SA 4.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Mercedes-Benz' AND m.nombre = 'GLC';

-- Volkswagen Virtus
INSERT INTO imagen_modelo (modelo_id, url, fuente_url, credito, orden)
SELECT m.id, f.url, f.fuente_url, f.credito, f.orden
FROM modelo m JOIN marca ma ON ma.id = m.marca_id
CROSS JOIN (VALUES
  ('/fotos/volkswagen-virtus-1.jpg', 'https://commons.wikimedia.org/wiki/File:2023_Volkswagen_Virtus_Topline_front_20230520.jpg', 'Dairokkan9 · CC BY-SA 4.0', 0),
  ('/fotos/volkswagen-virtus-2.jpg', 'https://commons.wikimedia.org/wiki/File:2023_Volkswagen_Virtus_Topline_rear_20230520.jpg', 'Dairokkan9 · CC BY-SA 4.0', 1),
  ('/fotos/volkswagen-virtus-3.jpg', 'https://commons.wikimedia.org/wiki/File:Volkswagen_Virtus_1.6_MSi_Trendline_2023.jpg', 'RL GNZLZ · CC BY-SA 2.0', 2)
) AS f(url, fuente_url, credito, orden)
WHERE ma.nombre = 'Volkswagen' AND m.nombre = 'Virtus';
