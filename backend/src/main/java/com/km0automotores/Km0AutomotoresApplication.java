package com.km0automotores;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

/**
 * Punto de entrada del backend de Km0 Automotores.
 * - @ConfigurationPropertiesScan: lee la sección "app" de application.yml (ver AppProperties).
 * - @EnableScheduling: habilita la tarea programada de recordatorios.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class Km0AutomotoresApplication {

    /** Debe coincidir con app.zona-horaria de application.yml. */
    private static final String ZONA_HORARIA = "America/Argentina/Cordoba";

    public static void main(String[] args) {
        // Los servidores en la nube suelen correr en UTC: se fija la hora de Argentina
        // para que las fechas de creación de los turnos se guarden con la hora local.
        TimeZone.setDefault(TimeZone.getTimeZone(ZONA_HORARIA));
        SpringApplication.run(Km0AutomotoresApplication.class, args);
    }
}
