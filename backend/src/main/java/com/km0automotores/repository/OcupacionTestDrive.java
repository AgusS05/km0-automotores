package com.km0automotores.repository;

import java.time.LocalTime;

/** Qué unidad y qué vendedor están ocupados en un horario (proyección liviana, sin cargar entidades). */
public record OcupacionTestDrive(LocalTime hora, Integer vehiculoId, Integer vendedorId) {
}
