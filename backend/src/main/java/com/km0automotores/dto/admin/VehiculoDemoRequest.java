package com.km0automotores.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record VehiculoDemoRequest(
        @NotNull(message = "Elegí la versión") Integer versionId,
        @NotNull(message = "Elegí la sucursal") Integer sucursalId,
        @NotBlank(message = "Ingresá la patente")
        @Pattern(regexp = "^([A-Za-z]{2}\\d{3}[A-Za-z]{2}|[A-Za-z]{3}\\d{3})$",
                message = "Patente inválida (formatos AB123CD o ABC123)") String patente,
        boolean disponible
) {
}
