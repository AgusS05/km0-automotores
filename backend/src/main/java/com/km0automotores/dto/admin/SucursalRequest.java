package com.km0automotores.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record SucursalRequest(
        @NotBlank(message = "Ingresá el nombre") @Size(max = 100) String nombre,
        @NotBlank(message = "Ingresá la dirección") @Size(max = 150) String direccion,
        @NotBlank(message = "Ingresá la ciudad") @Size(max = 80) String ciudad,
        @Size(max = 30) String telefono,
        @NotNull(message = "Ingresá el horario de apertura") LocalTime horarioApertura,
        @NotNull(message = "Ingresá el horario de cierre") LocalTime horarioCierre,
        LocalTime cierreSabado
) {
}
