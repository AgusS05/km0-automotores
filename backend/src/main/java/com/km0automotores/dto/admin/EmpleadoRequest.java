package com.km0automotores.dto.admin;

import com.km0automotores.model.Rol;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Alta o edición de un empleado. En la edición, si password viene vacío
 * se mantiene la contraseña actual.
 */
public record EmpleadoRequest(
        @NotBlank(message = "Ingresá el nombre") @Size(max = 80) String nombre,
        @NotBlank(message = "Ingresá el apellido") @Size(max = 80) String apellido,
        @NotBlank(message = "Ingresá el email") @Email(message = "El email no es válido") @Size(max = 150) String email,
        @Size(max = 72, message = "La contraseña puede tener hasta 72 caracteres") String password,
        @Size(max = 30) String telefono,
        @NotNull(message = "Elegí el rol") Rol rol,
        Integer sucursalId
) {
}
