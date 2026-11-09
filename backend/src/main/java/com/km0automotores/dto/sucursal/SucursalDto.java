package com.km0automotores.dto.sucursal;

import java.time.LocalTime;

public record SucursalDto(
        Integer id,
        String nombre,
        String direccion,
        String ciudad,
        String telefono,
        LocalTime horarioApertura,
        LocalTime horarioCierre,
        LocalTime cierreSabado
) {
}
