package com.km0automotores.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Configuración propia de la aplicación (sección "app" de application.yml).
 * Spring completa este record automáticamente al arrancar.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String zonaHoraria,
        Cors cors,
        Jwt jwt,
        Turnos turnos,
        Notificaciones notificaciones
) {
    public record Cors(List<String> origenesPermitidos) {}

    public record Jwt(String secreto, int expiracionHoras) {}

    public record Turnos(int duracionMinutos, int anticipacionMinimaMinutos, int diasMaximosAdelanto) {}

    public record Notificaciones(boolean emailHabilitado, String remitente) {}
}
