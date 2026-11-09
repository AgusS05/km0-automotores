package com.km0automotores.dto.turno;

import java.time.LocalDate;
import java.util.List;

/**
 * Horarios de un día. Si no hay ninguno, "motivo" explica por qué
 * (ej. "La sucursal no atiende ese día").
 */
public record DisponibilidadDto(LocalDate fecha, Integer sucursalId, List<HorarioDto> horarios, String motivo) {
}
