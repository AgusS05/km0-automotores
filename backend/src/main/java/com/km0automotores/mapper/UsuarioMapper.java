package com.km0automotores.mapper;

import com.km0automotores.dto.auth.UsuarioDto;
import com.km0automotores.model.Sucursal;
import com.km0automotores.model.Usuario;

public final class UsuarioMapper {

    private UsuarioMapper() {
    }

    public static UsuarioDto toDto(Usuario u) {
        Sucursal s = u.getSucursal();
        return new UsuarioDto(u.getId(), u.getNombre(), u.getApellido(), u.getEmail(), u.getTelefono(),
                u.getRol(), s == null ? null : s.getId(), s == null ? null : s.getNombre(), u.isActivo());
    }
}
