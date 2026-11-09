package com.km0automotores.dto.turno;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * El cliente elige modelo, sucursal, día y hora (que no sea pasado lo valida el servicio
 * con la hora de Argentina, no con la del servidor).
 * El sistema asigna la unidad
 * demo y el vendedor libres en ese horario.
 */
public record ReservaTestDriveRequest(
        @NotNull(message = "Elegí un modelo") Integer modeloId,
        @NotNull(message = "Elegí una sucursal") Integer sucursalId,
        @NotNull(message = "Elegí un día") LocalDate fecha,
        @NotNull(message = "Elegí un horario") LocalTime horaInicio,
        @Size(max = 500, message = "Las observaciones pueden tener hasta 500 caracteres") String observaciones
) {
}
