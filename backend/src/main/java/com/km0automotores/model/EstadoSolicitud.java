package com.km0automotores.model;

import java.util.EnumSet;
import java.util.Set;

/**
 * Estados de una solicitud de compra (el "embudo" de venta).
 *
 *   NUEVA ──► CONTACTADA ──► RESERVADA ──► VENDIDA
 *     │            │             │
 *     └────────────┴─────────────┴──► DESCARTADA
 *
 * VENDIDA y DESCARTADA son finales. Mientras está NUEVA, CONTACTADA o RESERVADA
 * la solicitud está "abierta": el cliente no puede abrir otra de la misma versión.
 */
public enum EstadoSolicitud {
    NUEVA,
    CONTACTADA,
    RESERVADA,
    VENDIDA,
    DESCARTADA;

    /** Estados a los que se puede pasar desde este. */
    public Set<EstadoSolicitud> siguientesPermitidos() {
        return switch (this) {
            case NUEVA -> EnumSet.of(CONTACTADA, DESCARTADA);
            case CONTACTADA -> EnumSet.of(RESERVADA, VENDIDA, DESCARTADA);
            case RESERVADA -> EnumSet.of(VENDIDA, DESCARTADA);
            case VENDIDA, DESCARTADA -> EnumSet.noneOf(EstadoSolicitud.class);
        };
    }

    /** @return true si la transición de este estado a {@code nuevo} está permitida */
    public boolean puedePasarA(EstadoSolicitud nuevo) {
        return siguientesPermitidos().contains(nuevo);
    }

    /** @return true mientras la venta sigue en curso */
    public boolean esAbierta() {
        return !siguientesPermitidos().isEmpty();
    }

    /** Estados abiertos (los que cuenta el índice único parcial uq_solicitud_abierta). */
    public static Set<EstadoSolicitud> abiertos() {
        return EnumSet.of(NUEVA, CONTACTADA, RESERVADA);
    }
}
