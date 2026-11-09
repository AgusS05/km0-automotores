package com.km0automotores.dto.catalogo;

import com.km0automotores.model.Combustible;
import com.km0automotores.model.TipoCarroceria;

import java.math.BigDecimal;

/** Filtros opcionales del catálogo (todos pueden venir en null). */
public record FiltroCatalogo(
        Integer marcaId,
        TipoCarroceria carroceria,
        Combustible combustible,
        BigDecimal precioMax,
        String q,
        Boolean destacados
) {
}
