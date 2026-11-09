package com.km0automotores.dto.turno;

import com.km0automotores.model.EstadoTurno;
import jakarta.validation.constraints.NotNull;

public record CambioEstadoRequest(@NotNull(message = "Indicá el nuevo estado") EstadoTurno estado) {
}
