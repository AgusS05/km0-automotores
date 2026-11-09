package com.km0automotores.dto.turno;

/** Datos mínimos de una persona dentro de un turno (cliente, vendedor o instructor). */
public record PersonaDto(Integer id, String nombreCompleto, String email, String telefono) {
}
