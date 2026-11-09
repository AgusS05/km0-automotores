package com.km0automotores.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Ingresá tu email") @Email(message = "El email no es válido") String email,
        @NotBlank(message = "Ingresá tu contraseña") String password
) {
}
