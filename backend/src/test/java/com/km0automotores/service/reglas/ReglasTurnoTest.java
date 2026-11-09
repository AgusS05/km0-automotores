package com.km0automotores.service.reglas;

import com.km0automotores.model.EstadoTurno;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReglasTurnoTest {

    private static final LocalDateTime INICIO = LocalDateTime.of(2026, 11, 2, 10, 0);

    @Test
    @DisplayName("Transiciones válidas del ciclo de vida de un turno")
    void transicionesValidas() {
        assertTrue(EstadoTurno.PENDIENTE.puedePasarA(EstadoTurno.CONFIRMADO));
        assertTrue(EstadoTurno.PENDIENTE.puedePasarA(EstadoTurno.CANCELADO));
        assertTrue(EstadoTurno.CONFIRMADO.puedePasarA(EstadoTurno.REALIZADO));
        assertTrue(EstadoTurno.CONFIRMADO.puedePasarA(EstadoTurno.AUSENTE));
    }

    @Test
    @DisplayName("Los estados finales no cambian y no se salta de PENDIENTE a REALIZADO")
    void transicionesInvalidas() {
        assertFalse(EstadoTurno.PENDIENTE.puedePasarA(EstadoTurno.REALIZADO));
        assertFalse(EstadoTurno.CANCELADO.puedePasarA(EstadoTurno.CONFIRMADO));
        assertFalse(EstadoTurno.REALIZADO.puedePasarA(EstadoTurno.AUSENTE));
        assertTrue(EstadoTurno.AUSENTE.esFinal());
    }

    @Test
    @DisplayName("La asistencia solo se marca cuando el turno ya empezó")
    void asistencia() {
        assertTrue(ReglasTurno.validarCambioEstado(EstadoTurno.CONFIRMADO, EstadoTurno.REALIZADO,
                INICIO, INICIO.minusMinutes(5)).isPresent());
        assertFalse(ReglasTurno.validarCambioEstado(EstadoTurno.CONFIRMADO, EstadoTurno.REALIZADO,
                INICIO, INICIO.plusMinutes(5)).isPresent());
        assertFalse(ReglasTurno.validarCambioEstado(EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO,
                INICIO, INICIO.minusDays(1)).isPresent());
    }

    @Test
    @DisplayName("El cliente puede cancelar antes de que empiece, no después")
    void cancelacionCliente() {
        assertFalse(ReglasTurno.validarCancelacionCliente(EstadoTurno.PENDIENTE, INICIO, INICIO.minusHours(2)).isPresent());
        assertTrue(ReglasTurno.validarCancelacionCliente(EstadoTurno.CONFIRMADO, INICIO, INICIO).isPresent());
        assertTrue(ReglasTurno.validarCancelacionCliente(EstadoTurno.REALIZADO, INICIO, INICIO.minusDays(1)).isPresent());
    }
}
