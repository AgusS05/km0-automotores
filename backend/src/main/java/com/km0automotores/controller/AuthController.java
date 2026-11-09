package com.km0automotores.controller;

import com.km0automotores.dto.auth.AuthResponse;
import com.km0automotores.dto.auth.LoginRequest;
import com.km0automotores.dto.auth.RegistroRequest;
import com.km0automotores.dto.auth.UsuarioDto;
import com.km0automotores.security.UsuarioAutenticado;
import com.km0automotores.service.AuthService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Autenticación", description = "Registro de clientes, login y datos del usuario logueado")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Registrar un cliente", description = "Crea la cuenta y devuelve el token, así queda logueado. 409 si el email ya existe.")
    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registro(@Valid @RequestBody RegistroRequest req) {
        return authService.registrar(req);
    }

    @Operation(summary = "Iniciar sesión", description = "Devuelve un token JWT válido por 24 horas. 401 si el email o la contraseña no son correctos.")
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    /** Datos del usuario logueado (el frontend lo usa al recargar la página). */
    @Operation(summary = "Usuario logueado", description = "Datos del usuario dueño del token.")
    @GetMapping("/yo")
    public UsuarioDto yo(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return authService.perfil(yo.getId());
    }
}
