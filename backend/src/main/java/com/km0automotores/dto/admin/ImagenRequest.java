package com.km0automotores.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ImagenRequest(
        @NotBlank(message = "Ingresá la URL de la imagen")
        @Pattern(regexp = "^(https?://|/).+", message = "La URL debe empezar con http(s):// o /")
        @Size(max = 500) String url,
        @Size(max = 500) String fuenteUrl,
        @Size(max = 200) String credito,
        Integer orden
) {
}
