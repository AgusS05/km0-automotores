package com.km0automotores.dto.comun;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Formato único de error que devuelve la API.
 *
 * @param campos errores de validación por campo (ej. "email" → "no es válido"); vacío si no aplica
 */
public record ErrorResponse(
        int status,
        String error,
        String mensaje,
        Map<String, String> campos,
        String path,
        LocalDateTime timestamp
) {
}
