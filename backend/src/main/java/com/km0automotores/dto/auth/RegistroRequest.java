package com.km0automotores.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Alta de un cliente desde la web. Los empleados los crea el administrador. */
public record RegistroRequest(
        @NotBlank(message = "Ingresá tu nombre") @Size(max = 80) String nombre,
        @NotBlank(message = "Ingresá tu apellido") @Size(max = 80) String apellido,
        @NotBlank(message = "Ingresá tu email") @Email(message = "El email no es válido") @Size(max = 150) String email,
        @NotBlank(message = "Elegí una contraseña")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres") String password,
        @Size(max = 30) String telefono
) {
}
