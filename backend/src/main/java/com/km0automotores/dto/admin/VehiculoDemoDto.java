package com.km0automotores.dto.admin;

public record VehiculoDemoDto(
        Integer id,
        String patente,
        boolean disponible,
        Integer versionId,
        String versionNombre,
        Integer modeloId,
        String modeloNombre,
        String marcaNombre,
        Integer sucursalId,
        String sucursalNombre
) {
}
