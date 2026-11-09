package com.km0automotores.dto.catalogo;

import com.km0automotores.model.Combustible;
import com.km0automotores.model.TipoCarroceria;

import java.math.BigDecimal;

/** Versión con datos de su modelo y marca: así el comparador no necesita otra consulta. */
public record VersionDto(
        Integer id,
        Integer modeloId,
        String modeloNombre,
        String marcaNombre,
        TipoCarroceria tipoCarroceria,
        String nombreVersion,
        BigDecimal precio,
        String motor,
        Integer potenciaCv,
        String transmision,
        Combustible combustible,
        String traccion,
        Integer puertas,
        Integer plazas,
        String imagenUrl
) {
}
