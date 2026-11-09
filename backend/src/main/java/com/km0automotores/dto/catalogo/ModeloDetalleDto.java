package com.km0automotores.dto.catalogo;

import com.km0automotores.dto.sucursal.SucursalDto;
import com.km0automotores.model.TipoCarroceria;

import java.math.BigDecimal;
import java.util.List;

/** Ficha completa de un modelo. */
public record ModeloDetalleDto(
        Integer id,
        String nombre,
        Integer marcaId,
        String marcaNombre,
        TipoCarroceria tipoCarroceria,
        Integer anio,
        String descripcion,
        boolean destacado,
        BigDecimal precioDesde,
        List<VersionDto> versiones,
        List<ImagenDto> imagenes,
        List<ColorDto> colores,
        List<SucursalDto> sucursalesConDemo
) {
}
