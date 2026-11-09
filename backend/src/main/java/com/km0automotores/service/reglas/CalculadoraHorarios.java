package com.km0automotores.service.reglas;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Reglas de calendario para turnos de test drive y clases de manejo.
 * Es una clase sin dependencias de Spring ni de la base: recibe datos y devuelve
 * resultados, por eso se prueba con tests unitarios simples (ver CalculadoraHorariosTest).
 */
public final class CalculadoraHorarios {

    private CalculadoraHorarios() {
    }

    /**
     * Horarios de inicio posibles de un día, en bloques de {@code duracionMinutos}.
     * Ej: abre 09:00, cierra 12:00, bloques de 60 → [09:00, 10:00, 11:00].
     * Domingo → lista vacía. Sábado → hasta cierreSabado (o vacía si no abre).
     */
    public static List<LocalTime> horariosDelDia(HorarioAtencion horario, LocalDate fecha, int duracionMinutos) {
        LocalTime cierre = cierreDelDia(horario, fecha).orElse(null);
        List<LocalTime> horarios = new ArrayList<>();
        if (cierre == null) {
            return horarios;
        }
        LocalTime inicio = horario.apertura();
        // "!inicio.plusMinutes(...).isAfter(cierre)" = el turno termina antes o justo al cierre
        while (!inicio.plusMinutes(duracionMinutos).isAfter(cierre)
                && inicio.plusMinutes(duracionMinutos).isAfter(inicio)) { // corta si pasa de medianoche
            horarios.add(inicio);
            inicio = inicio.plusMinutes(duracionMinutos);
        }
        return horarios;
    }

    /** Hora de cierre para esa fecha, o vacío si ese día la sucursal no abre. */
    public static Optional<LocalTime> cierreDelDia(HorarioAtencion horario, LocalDate fecha) {
        DayOfWeek dia = fecha.getDayOfWeek();
        if (dia == DayOfWeek.SUNDAY) {
            return Optional.empty();
        }
        if (dia == DayOfWeek.SATURDAY) {
            return Optional.ofNullable(horario.cierreSabado());
        }
        return Optional.of(horario.cierre());
    }

    /**
     * Valida que una fecha/hora se pueda reservar. Devuelve el motivo si NO se puede,
     * o vacío si está todo bien.
     */
    public static Optional<String> validarReserva(HorarioAtencion horario, LocalDate fecha, LocalTime hora,
                                                  LocalDateTime ahora, int duracionMinutos,
                                                  int anticipacionMinimaMinutos, int diasMaximosAdelanto) {
        LocalDateTime inicio = fecha.atTime(hora);
        if (inicio.isBefore(ahora.plusMinutes(anticipacionMinimaMinutos))) {
            return Optional.of("Los turnos se reservan con al menos " + anticipacionMinimaMinutos
                    + " minutos de anticipación.");
        }
        if (fecha.isAfter(ahora.toLocalDate().plusDays(diasMaximosAdelanto))) {
            return Optional.of("Se puede reservar hasta " + diasMaximosAdelanto + " días hacia adelante.");
        }
        if (cierreDelDia(horario, fecha).isEmpty()) {
            return Optional.of("La sucursal no atiende ese día.");
        }
        if (!horariosDelDia(horario, fecha, duracionMinutos).contains(hora)) {
            return Optional.of("Ese horario está fuera del horario de atención de la sucursal.");
        }
        return Optional.empty();
    }

    /** true si el horario todavía se puede ofrecer (respeta la anticipación mínima). */
    public static boolean estaAlAlcance(LocalDate fecha, LocalTime hora, LocalDateTime ahora,
                                        int anticipacionMinimaMinutos) {
        return !fecha.atTime(hora).isBefore(ahora.plusMinutes(anticipacionMinimaMinutos));
    }
}
