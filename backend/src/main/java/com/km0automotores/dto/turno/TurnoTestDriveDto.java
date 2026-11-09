package com.km0automotores.dto.turno;

import com.km0automotores.model.EstadoTurno;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record TurnoTestDriveDto(
        Integer id,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        EstadoTurno estado,
        Integer modeloId,
        String modeloNombre,
        String marcaNombre,
        String versionNombre,
        String patente,
        Integer sucursalId,
        String sucursalNombre,
        String sucursalDireccion,
        PersonaDto cliente,
        PersonaDto vendedor,
        String observaciones,
        LocalDateTime creadoEn
) {
}
