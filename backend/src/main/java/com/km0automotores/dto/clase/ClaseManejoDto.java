package com.km0automotores.dto.clase;

import com.km0automotores.dto.turno.PersonaDto;
import com.km0automotores.model.EstadoTurno;
import com.km0automotores.model.Transmision;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record ClaseManejoDto(
        Integer id,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        EstadoTurno estado,
        Transmision transmision,
        Integer sucursalId,
        String sucursalNombre,
        String sucursalDireccion,
        PersonaDto cliente,
        PersonaDto instructor,
        String observaciones,
        LocalDateTime creadoEn
) {
}
