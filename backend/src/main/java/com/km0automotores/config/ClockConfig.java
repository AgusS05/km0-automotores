package com.km0automotores.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/**
 * Reloj de la aplicación en hora de Argentina.
 * Los servicios usan LocalDate.now(clock) en lugar de LocalDate.now(): así la hora
 * no depende de dónde esté el servidor (Render corre en UTC) y en los tests se
 * puede usar un reloj fijo.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock(AppProperties props) {
        return Clock.system(ZoneId.of(props.zonaHoraria()));
    }
}
