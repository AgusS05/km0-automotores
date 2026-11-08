-- =====================================================================
-- Km0 Automotores — Migración V3: turnos y clases de DEMOSTRACIÓN
-- Genera actividad de las últimas 5 semanas y de los próximos días,
-- relativa a la fecha en que se ejecuta la migración, para que el panel
-- de métricas y la agenda tengan datos desde el primer arranque.
-- En un despliegue real para un cliente, esta migración se elimina.
--
-- Respeta las mismas reglas que la aplicación: domingos cerrado, sábados
-- solo hasta cierre_sabado, turnos de 1 hora, sin superposiciones.
-- =====================================================================

DO $$
DECLARE
    v_dia        INTEGER;
    v_fecha      DATE;
    v_hoy        DATE := CURRENT_DATE;
    v_suc        RECORD;
    v_cierre     TIME;
    v_hora       TIME;
    v_vehiculo   INTEGER;
    v_vendedor   INTEGER;
    v_instructor INTEGER;
    v_cliente    INTEGER;
    v_estado     VARCHAR(20);
    v_azar       DOUBLE PRECISION;
    v_demo       INTEGER;
BEGIN
    PERFORM setseed(0.42);  -- datos "aleatorios" pero siempre iguales

    -- ---------- Turnos fijos del cliente demo (cliente@example.com) ----------
    -- Uno ya realizado, uno próximo pendiente y una clase de manejo próxima,
    -- para que "Mis turnos" muestre los distintos estados.
    SELECT id INTO v_demo FROM usuario WHERE email = 'cliente@example.com';

    v_fecha := v_hoy - 9;
    IF EXTRACT(DOW FROM v_fecha) = 0 THEN v_fecha := v_fecha - 1; END IF;
    INSERT INTO turno_test_drive (cliente_id, vehiculo_demo_id, vendedor_id, fecha, hora_inicio, hora_fin,
                                  estado, recordatorio_enviado, creado_en)
    SELECT v_demo, v.id, (SELECT id FROM usuario WHERE email = 'martin.ferreyra@km0.com.ar'),
           v_fecha, TIME '10:00', TIME '11:00', 'REALIZADO', TRUE, v_fecha - 3 + TIME '18:20'
      FROM vehiculo_demo v JOIN version ve ON ve.id = v.version_id JOIN modelo m ON m.id = ve.modelo_id
     WHERE m.nombre = 'Onix' AND v.sucursal_id = 1
     LIMIT 1
    ON CONFLICT DO NOTHING;

    v_fecha := v_hoy + 3;
    IF EXTRACT(DOW FROM v_fecha) IN (0, 6) THEN v_fecha := v_fecha + 2; END IF;
    INSERT INTO turno_test_drive (cliente_id, vehiculo_demo_id, vendedor_id, fecha, hora_inicio, hora_fin,
                                  estado, observaciones, creado_en)
    SELECT v_demo, v.id, (SELECT id FROM usuario WHERE email = 'sofia.rinaldi@km0.com.ar'),
           v_fecha, TIME '17:00', TIME '18:00', 'PENDIENTE',
           'Me interesa probarla en ruta, vengo con mi pareja.', now()
      FROM vehiculo_demo v JOIN version ve ON ve.id = v.version_id JOIN modelo m ON m.id = ve.modelo_id
     WHERE m.nombre = 'Corolla Cross' AND v.sucursal_id = 1
     LIMIT 1
    ON CONFLICT DO NOTHING;

    INSERT INTO clase_manejo (cliente_id, instructor_id, sucursal_id, fecha, hora_inicio, hora_fin,
                              transmision, estado, creado_en)
    VALUES (v_demo, (SELECT id FROM usuario WHERE email = 'valeria.ponce@km0.com.ar'), 1,
            v_fecha, TIME '10:00', TIME '11:00', 'MANUAL', 'CONFIRMADO', now())
    ON CONFLICT DO NOTHING;

    FOR v_dia IN -35..4 LOOP
        v_fecha := v_hoy + v_dia;
        CONTINUE WHEN EXTRACT(DOW FROM v_fecha) = 0;           -- domingo

        FOR v_suc IN SELECT * FROM sucursal ORDER BY id LOOP
            IF EXTRACT(DOW FROM v_fecha) = 6 THEN               -- sábado
                CONTINUE WHEN v_suc.cierre_sabado IS NULL;
                v_cierre := v_suc.cierre_sabado;
            ELSE
                v_cierre := v_suc.horario_cierre;
            END IF;

            v_hora := v_suc.horario_apertura;
            WHILE v_hora + INTERVAL '1 hour' <= v_cierre LOOP

                -- ---------- Test drives ----------
                IF random() < (CASE WHEN v_dia < 0 THEN 0.30 ELSE 0.25 END) THEN
                    SELECT id INTO v_vehiculo FROM vehiculo_demo
                     WHERE sucursal_id = v_suc.id AND disponible ORDER BY random() LIMIT 1;
                    SELECT id INTO v_vendedor FROM usuario
                     WHERE rol = 'VENDEDOR' AND sucursal_id = v_suc.id ORDER BY random() LIMIT 1;
                    SELECT id INTO v_cliente FROM usuario u
                     WHERE rol = 'CLIENTE' AND email <> 'cliente@example.com'
                       AND NOT EXISTS (SELECT 1 FROM turno_test_drive t
                                        WHERE t.cliente_id = u.id AND t.fecha = v_fecha
                                          AND t.hora_inicio = v_hora AND t.estado <> 'CANCELADO')
                       AND NOT EXISTS (SELECT 1 FROM clase_manejo c
                                        WHERE c.cliente_id = u.id AND c.fecha = v_fecha
                                          AND c.hora_inicio = v_hora AND c.estado <> 'CANCELADO')
                     ORDER BY random() LIMIT 1;

                    v_azar := random();
                    IF v_dia < 0 THEN
                        v_estado := CASE WHEN v_azar < 0.68 THEN 'REALIZADO'
                                         WHEN v_azar < 0.85 THEN 'AUSENTE'
                                         ELSE 'CANCELADO' END;
                    ELSE
                        v_estado := CASE WHEN v_azar < 0.55 THEN 'PENDIENTE' ELSE 'CONFIRMADO' END;
                    END IF;

                    IF v_vehiculo IS NOT NULL AND v_vendedor IS NOT NULL AND v_cliente IS NOT NULL THEN
                        INSERT INTO turno_test_drive
                            (cliente_id, vehiculo_demo_id, vendedor_id, fecha, hora_inicio, hora_fin,
                             estado, recordatorio_enviado, creado_en)
                        VALUES
                            (v_cliente, v_vehiculo, v_vendedor, v_fecha, v_hora, v_hora + INTERVAL '1 hour',
                             v_estado, v_dia <= 0,
                             (v_fecha - (1 + floor(random() * 6))::INTEGER) + TIME '10:00')
                        ON CONFLICT DO NOTHING;   -- si choca con un índice único, se saltea
                    END IF;
                END IF;

                -- ---------- Clases de manejo ----------
                FOR v_instructor IN
                    SELECT id FROM usuario WHERE rol = 'INSTRUCTOR' AND sucursal_id = v_suc.id
                LOOP
                    IF random() < (CASE WHEN v_dia < 0 THEN 0.30 ELSE 0.20 END) THEN
                        SELECT id INTO v_cliente FROM usuario u
                         WHERE rol = 'CLIENTE' AND email <> 'cliente@example.com'
                           AND NOT EXISTS (SELECT 1 FROM clase_manejo c
                                            WHERE c.cliente_id = u.id AND c.fecha = v_fecha
                                              AND c.hora_inicio = v_hora AND c.estado <> 'CANCELADO')
                           AND NOT EXISTS (SELECT 1 FROM turno_test_drive t
                                            WHERE t.cliente_id = u.id AND t.fecha = v_fecha
                                              AND t.hora_inicio = v_hora AND t.estado <> 'CANCELADO')
                         ORDER BY random() LIMIT 1;

                        v_azar := random();
                        IF v_dia < 0 THEN
                            v_estado := CASE WHEN v_azar < 0.80 THEN 'REALIZADO'
                                             WHEN v_azar < 0.90 THEN 'AUSENTE'
                                             ELSE 'CANCELADO' END;
                        ELSE
                            v_estado := CASE WHEN v_azar < 0.5 THEN 'PENDIENTE' ELSE 'CONFIRMADO' END;
                        END IF;

                        IF v_cliente IS NOT NULL THEN
                            INSERT INTO clase_manejo
                                (cliente_id, instructor_id, sucursal_id, fecha, hora_inicio, hora_fin,
                                 transmision, estado, recordatorio_enviado, creado_en)
                            VALUES
                                (v_cliente, v_instructor, v_suc.id, v_fecha, v_hora, v_hora + INTERVAL '1 hour',
                                 CASE WHEN random() < 0.65 THEN 'MANUAL' ELSE 'AUTOMATICA' END,
                                 v_estado, v_dia <= 0,
                                 (v_fecha - (1 + floor(random() * 6))::INTEGER) + TIME '10:00')
                            ON CONFLICT DO NOTHING;
                        END IF;
                    END IF;
                END LOOP;

                v_hora := v_hora + INTERVAL '1 hour';
            END LOOP;
        END LOOP;
    END LOOP;

END $$;
