package com.km0automotores.service.reglas;

import java.time.LocalTime;

/**
 * Horario de una sucursal, separado de la entidad para que las reglas
 * se puedan probar sin base de datos.
 *
 * @param apertura     hora de apertura (lunes a sábado)
 * @param cierre       hora de cierre de lunes a viernes
 * @param cierreSabado hora de cierre de los sábados, o null si no abre
 */
public record HorarioAtencion(LocalTime apertura, LocalTime cierre, LocalTime cierreSabado) {
}
