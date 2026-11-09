package com.km0automotores.service.reglas;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalculadoraHorariosTest {

    // Lunes a viernes 9 a 12, sábados 9 a 11
    private static final HorarioAtencion HORARIO =
            new HorarioAtencion(LocalTime.of(9, 0), LocalTime.of(12, 0), LocalTime.of(11, 0));
    private static final HorarioAtencion SIN_SABADOS =
            new HorarioAtencion(LocalTime.of(9, 0), LocalTime.of(12, 0), null);

    private static final LocalDate LUNES = LocalDate.of(2026, 11, 2);
    private static final LocalDate SABADO = LocalDate.of(2026, 11, 7);
    private static final LocalDate DOMINGO = LocalDate.of(2026, 11, 8);

    @Test
    @DisplayName("Un día hábil genera bloques de una hora hasta el cierre")
    void diaHabil() {
        assertEquals(List.of(LocalTime.of(9, 0), LocalTime.of(10, 0), LocalTime.of(11, 0)),
                CalculadoraHorarios.horariosDelDia(HORARIO, LUNES, 60));
    }

    @Test
    @DisplayName("El sábado usa el cierre de sábado")
    void sabado() {
        assertEquals(List.of(LocalTime.of(9, 0), LocalTime.of(10, 0)),
                CalculadoraHorarios.horariosDelDia(HORARIO, SABADO, 60));
    }

    @Test
    @DisplayName("Domingo y sábado sin atención no tienen horarios")
    void diasSinAtencion() {
        assertTrue(CalculadoraHorarios.horariosDelDia(HORARIO, DOMINGO, 60).isEmpty());
        assertTrue(CalculadoraHorarios.horariosDelDia(SIN_SABADOS, SABADO, 60).isEmpty());
    }

    @Test
    @DisplayName("Con bloques de 90 minutos no se ofrece uno que termine después del cierre")
    void bloqueQueNoEntra() {
        // 9:00-10:30 y 10:30-12:00 entran; no hay un tercero
        assertEquals(List.of(LocalTime.of(9, 0), LocalTime.of(10, 30)),
                CalculadoraHorarios.horariosDelDia(HORARIO, LUNES, 90));
    }

    @Test
    @DisplayName("Una reserva válida no devuelve motivo de rechazo")
    void reservaValida() {
        LocalDateTime ahora = LUNES.minusDays(1).atTime(18, 0);
        assertEquals(Optional.empty(),
                CalculadoraHorarios.validarReserva(HORARIO, LUNES, LocalTime.of(10, 0), ahora, 60, 60, 30));
    }

    @Test
    @DisplayName("Se rechaza un horario con menos de una hora de anticipación")
    void sinAnticipacion() {
        LocalDateTime ahora = LUNES.atTime(9, 30);
        assertTrue(CalculadoraHorarios.validarReserva(HORARIO, LUNES, LocalTime.of(10, 0), ahora, 60, 60, 30).isPresent());
    }

    @Test
    @DisplayName("Se rechaza un día demasiado lejano, un domingo y un horario fuera de atención")
    void rechazos() {
        LocalDateTime ahora = LUNES.minusDays(1).atTime(18, 0);
        assertTrue(CalculadoraHorarios.validarReserva(HORARIO, LUNES.plusDays(60), LocalTime.of(10, 0), ahora, 60, 60, 30).isPresent());
        assertTrue(CalculadoraHorarios.validarReserva(HORARIO, DOMINGO, LocalTime.of(10, 0), ahora, 60, 60, 30).isPresent());
        assertTrue(CalculadoraHorarios.validarReserva(HORARIO, LUNES, LocalTime.of(12, 0), ahora, 60, 60, 30).isPresent());
        assertTrue(CalculadoraHorarios.validarReserva(HORARIO, LUNES, LocalTime.of(10, 15), ahora, 60, 60, 30).isPresent());
    }

    @Test
    @DisplayName("estaAlAlcance respeta la anticipación mínima")
    void alAlcance() {
        LocalDateTime ahora = LUNES.atTime(9, 0);
        assertFalse(CalculadoraHorarios.estaAlAlcance(LUNES, LocalTime.of(9, 0), ahora, 60));
        assertTrue(CalculadoraHorarios.estaAlAlcance(LUNES, LocalTime.of(10, 0), ahora, 60));
    }
}
