package com.km0automotores.dto.admin;

import com.km0automotores.model.Combustible;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record VersionRequest(
        @NotNull(message = "Elegí el modelo") Integer modeloId,
        @NotBlank(message = "Ingresá el nombre de la versión") @Size(max = 100) String nombreVersion,
        @NotNull(message = "Ingresá el precio") @DecimalMin(value = "1", message = "El precio debe ser mayor a 0") BigDecimal precio,
        @Size(max = 60) String motor,
        @Positive Integer potenciaCv,
        @Size(max = 40) String transmision,
        @NotNull(message = "Elegí el combustible") Combustible combustible,
        @Size(max = 30) String traccion,
        @Min(2) @Max(5) Integer puertas,
        @Min(2) @Max(9) Integer plazas
) {
}
