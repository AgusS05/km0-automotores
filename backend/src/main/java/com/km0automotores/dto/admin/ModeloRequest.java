package com.km0automotores.dto.admin;

import com.km0automotores.model.TipoCarroceria;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ModeloRequest(
        @NotNull(message = "Elegí la marca") Integer marcaId,
        @NotBlank(message = "Ingresá el nombre") @Size(max = 100) String nombre,
        @NotNull(message = "Elegí la carrocería") TipoCarroceria tipoCarroceria,
        @NotNull(message = "Ingresá el año") @Min(2000) @Max(2100) Integer anio,
        @Size(max = 1000) String descripcion,
        boolean destacado
) {
}
