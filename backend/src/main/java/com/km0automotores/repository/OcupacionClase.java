package com.km0automotores.repository;

import java.time.LocalTime;

/** Qué instructor está ocupado en un horario. */
public record OcupacionClase(LocalTime hora, Integer instructorId) {
}
