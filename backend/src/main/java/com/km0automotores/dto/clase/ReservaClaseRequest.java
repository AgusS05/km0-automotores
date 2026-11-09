package com.km0automotores.dto.clase;

import com.km0automotores.model.Transmision;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Reserva de una clase de manejo. El instructor es opcional: si no se elige,
 * el sistema asigna el que tenga menos clases ese día.
 */
public record ReservaClaseRequest(
        @NotNull(message = "Elegí una sucursal") Integer sucursalId,
        @NotNull(message = "Elegí un día") LocalDate fecha,
        @NotNull(message = "Elegí un horario") LocalTime horaInicio,
        @NotNull(message = "Elegí el tipo de caja") Transmision transmision,
        Integer instructorId,
        @Size(max = 500, message = "Las observaciones pueden tener hasta 500 caracteres") String observaciones
) {
}
