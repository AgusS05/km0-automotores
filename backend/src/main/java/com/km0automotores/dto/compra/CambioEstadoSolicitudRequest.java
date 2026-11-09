package com.km0automotores.dto.compra;

import com.km0automotores.model.EstadoSolicitud;
import jakarta.validation.constraints.NotNull;

public record CambioEstadoSolicitudRequest(@NotNull(message = "Indicá el nuevo estado") EstadoSolicitud estado) {
}
