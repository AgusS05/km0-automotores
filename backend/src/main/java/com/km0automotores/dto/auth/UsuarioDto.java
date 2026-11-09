package com.km0automotores.dto.auth;

import com.km0automotores.model.Rol;

public record UsuarioDto(
        Integer id,
        String nombre,
        String apellido,
        String email,
        String telefono,
        Rol rol,
        Integer sucursalId,
        String sucursalNombre,
        boolean activo
) {
}
