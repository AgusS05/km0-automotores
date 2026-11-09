package com.km0automotores.service.reglas;

import com.km0automotores.model.EstadoTurno;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Reglas para cambiar el estado de un turno (test drive o clase).
 * Devuelven el motivo del rechazo, o vacío si el cambio es válido.
 */
public final class ReglasTurno {

    private ReglasTurno() {
    }

    /** Cambio de estado hecho por un empleado (vendedor, instructor o admin). */
    public static Optional<String> validarCambioEstado(EstadoTurno actual, EstadoTurno nuevo,
                                                       LocalDateTime inicioTurno, LocalDateTime ahora) {
        if (actual == nuevo) {
            return Optional.of("El turno ya está en estado " + actual + ".");
        }
        if (!actual.puedePasarA(nuevo)) {
            return Optional.of("No se puede pasar un turno de " + actual + " a " + nuevo + ".");
        }
        boolean marcaAsistencia = nuevo == EstadoTurno.REALIZADO || nuevo == EstadoTurno.AUSENTE;
        if (marcaAsistencia && ahora.isBefore(inicioTurno)) {
            return Optional.of("La asistencia se marca recién cuando empieza el turno.");
        }
        return Optional.empty();
    }

    /** Cancelación hecha por el propio cliente: solo antes de que empiece. */
    public static Optional<String> validarCancelacionCliente(EstadoTurno actual, LocalDateTime inicioTurno,
                                                             LocalDateTime ahora) {
        if (!actual.puedePasarA(EstadoTurno.CANCELADO)) {
            return Optional.of("Este turno ya no se puede cancelar (estado " + actual + ").");
        }
        if (!ahora.isBefore(inicioTurno)) {
            return Optional.of("El turno ya empezó; no se puede cancelar.");
        }
        return Optional.empty();
    }
}
