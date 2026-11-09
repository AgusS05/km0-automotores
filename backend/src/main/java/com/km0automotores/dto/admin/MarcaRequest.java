package com.km0automotores.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MarcaRequest(@NotBlank(message = "Ingresá el nombre") @Size(max = 100) String nombre) {
}
