package com.km0automotores.dto.auth;

/** Respuesta de login/registro: el token va en el header Authorization de los siguientes pedidos. */
public record AuthResponse(String token, UsuarioDto usuario) {
}
