package com.km0automotores.dto.metricas;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Indicadores del panel de administración para un período.
 *
 * @param tasaAsistencia  realizados / (realizados + ausentes), entre 0 y 1; null si no hay datos
 * @param sinConfirmar    turnos PENDIENTES de hoy a 2 días (los que hay que llamar)
 */
public record MetricasDto(
        LocalDate desde,
        LocalDate hasta,
        long totalTestDrives,
        Map<String, Long> testDrivesPorEstado,
        Double tasaAsistencia,
        long sinConfirmar,
        List<ConteoDto> porModelo,
        List<ConteoDto> porHorario,
        List<ConteoDto> porSucursal,
        long totalClases,
        Map<String, Long> clasesPorEstado,
        List<ConteoDto> clasesPorInstructor
) {
}
