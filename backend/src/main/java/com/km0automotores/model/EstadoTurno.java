package com.km0automotores.model;

import java.util.EnumSet;
import java.util.Set;

/**
 * Estados de un test drive o una clase de manejo, y qué cambios están permitidos.
 *
 *   PENDIENTE ──► CONFIRMADO ──► REALIZADO
 *       │             │      └─► AUSENTE
 *       └──► CANCELADO ◄┘
 *
 * REALIZADO, AUSENTE y CANCELADO son finales: no se pueden modificar.
 */
public enum EstadoTurno {
    PENDIENTE,
    CONFIRMADO,
    REALIZADO,
    AUSENTE,
    CANCELADO;

    /**
     * Estados a los que se puede pasar desde este.
     * PENDIENTE → CONFIRMADO o CANCELADO; CONFIRMADO → REALIZADO, AUSENTE o CANCELADO;
     * REALIZADO, AUSENTE y CANCELADO son finales.
     */
    public Set<EstadoTurno> siguientesPermitidos() {
        return switch (this) {
            case PENDIENTE -> EnumSet.of(CONFIRMADO, CANCELADO);
            case CONFIRMADO -> EnumSet.of(REALIZADO, AUSENTE, CANCELADO);
            case REALIZADO, AUSENTE, CANCELADO -> EnumSet.noneOf(EstadoTurno.class);
        };
    }

    /**
     * @return true si la transición de este estado a {@code nuevo} está permitida
     */
    public boolean puedePasarA(EstadoTurno nuevo) {
        return siguientesPermitidos().contains(nuevo);
    }

    /** Un turno activo ocupa su horario (todos menos los cancelados). */
    public boolean ocupaHorario() {
        return this != CANCELADO;
    }

    /**
     * @return true si el turno ya no puede cambiar de estado
     */
    public boolean esFinal() {
        return siguientesPermitidos().isEmpty();
    }
}
