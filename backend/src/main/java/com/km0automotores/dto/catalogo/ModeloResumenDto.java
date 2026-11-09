package com.km0automotores.dto.catalogo;

import com.km0automotores.model.Combustible;
import com.km0automotores.model.TipoCarroceria;

import java.math.BigDecimal;
import java.util.Set;

/** Lo que muestra cada tarjeta del catálogo. */
public record ModeloResumenDto(
        Integer id,
        String nombre,
        Integer marcaId,
        String marcaNombre,
        TipoCarroceria tipoCarroceria,
        Integer anio,
        BigDecimal precioDesde,
        String imagenUrl,
        Set<Combustible> combustibles,
        int cantidadVersiones,
        boolean destacado
) {
}
