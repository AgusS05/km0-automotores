package com.km0automotores.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ColorRequest(
        @NotBlank(message = "Ingresá el nombre del color") @Size(max = 60) String nombre,
        @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "El color debe tener formato #RRGGBB") String hex
) {
}
