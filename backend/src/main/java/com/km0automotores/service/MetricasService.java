package com.km0automotores.service;

import com.km0automotores.dto.metricas.ConteoDto;
import com.km0automotores.dto.metricas.MetricasDto;
import com.km0automotores.model.EstadoTurno;
import com.km0automotores.repository.ClaseManejoRepository;
import com.km0automotores.repository.TurnoTestDriveRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Indicadores para el panel del administrador: qué modelos se piden más,
 * en qué horarios, cuánta gente falta y cuántos turnos falta confirmar.
 * Es el "valor agregado" de la propuesta: no solo agendar, sino ver patrones.
 */
@Service
@Transactional(readOnly = true)
public class MetricasService {

    private final TurnoTestDriveRepository turnoRepository;
    private final ClaseManejoRepository claseRepository;
    private final Clock clock;

    public MetricasService(TurnoTestDriveRepository turnoRepository, ClaseManejoRepository claseRepository,
                           Clock clock) {
        this.turnoRepository = turnoRepository;
        this.claseRepository = claseRepository;
        this.clock = clock;
    }

    /**
     * Calcula los indicadores del panel de administración para un período.
     *
     * <p>Los conteos se resuelven en la base con {@code GROUP BY}; la tasa de asistencia
     * es realizados / (realizados + ausentes).</p>
     *
     * @param desde inicio del período (por defecto, hace 30 días)
     * @param hasta fin del período (por defecto, hoy)
     * @return totales por estado, modelo, horario y sucursal, y datos de la escuela de manejo
     */
    public MetricasDto calcular(LocalDate desde, LocalDate hasta) {
        LocalDate hoy = LocalDate.now(clock);
        LocalDate fin = hasta != null ? hasta : hoy;
        LocalDate inicio = desde != null ? desde : fin.minusDays(30);
        TestDriveService.validarRango(inicio, fin);

        Map<String, Long> porEstado = porEstado(turnoRepository.contarPorEstado(inicio, fin));
        long realizados = porEstado.get(EstadoTurno.REALIZADO.name());
        long ausentes = porEstado.get(EstadoTurno.AUSENTE.name());
        Double tasaAsistencia = realizados + ausentes == 0 ? null : (double) realizados / (realizados + ausentes);

        Map<String, Long> clasesPorEstado = porEstado(claseRepository.contarPorEstado(inicio, fin));

        return new MetricasDto(
                inicio,
                fin,
                porEstado.values().stream().mapToLong(Long::longValue).sum(),
                porEstado,
                tasaAsistencia,
                turnoRepository.countByEstadoAndFechaBetween(EstadoTurno.PENDIENTE, hoy, hoy.plusDays(2)),
                conteos(turnoRepository.contarPorModelo(inicio, fin, EstadoTurno.CANCELADO)),
                horarios(turnoRepository.contarPorHorario(inicio, fin, EstadoTurno.CANCELADO)),
                conteos(turnoRepository.contarPorSucursal(inicio, fin, EstadoTurno.CANCELADO)),
                clasesPorEstado.values().stream().mapToLong(Long::longValue).sum(),
                clasesPorEstado,
                conteos(claseRepository.contarPorInstructor(inicio, fin, EstadoTurno.CANCELADO)));
    }

    /** Devuelve todos los estados (en orden), con 0 si no hubo ninguno. */
    private static Map<String, Long> porEstado(List<Object[]> filas) {
        Map<String, Long> resultado = new LinkedHashMap<>();
        for (EstadoTurno estado : EstadoTurno.values()) {
            resultado.put(estado.name(), 0L);
        }
        for (Object[] fila : filas) {
            resultado.put(((EstadoTurno) fila[0]).name(), ((Number) fila[1]).longValue());
        }
        return resultado;
    }

    private static List<ConteoDto> conteos(List<Object[]> filas) {
        return filas.stream()
                .map(f -> new ConteoDto(String.valueOf(f[0]), ((Number) f[1]).longValue()))
                .toList();
    }

    /** Las horas llegan como LocalTime (10:00:00) y se muestran como "10:00". */
    private static List<ConteoDto> horarios(List<Object[]> filas) {
        return filas.stream()
                .map(f -> new ConteoDto(((LocalTime) f[0]).toString(), ((Number) f[1]).longValue()))
                .toList();
    }
}
