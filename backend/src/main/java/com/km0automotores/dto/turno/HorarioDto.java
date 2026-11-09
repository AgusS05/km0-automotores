package com.km0automotores.dto.turno;

import java.time.LocalTime;

/**
 * Un bloque horario del día.
 *
 * @param disponible true si todavía se puede reservar
 * @param lugares    cuántas reservas más entran en ese horario (unidades/instructores libres)
 */
public record HorarioDto(LocalTime hora, boolean disponible, int lugares) {
}
