package com.km0automotores.security;

import com.km0automotores.model.Usuario;
import com.km0automotores.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Se ejecuta una vez por pedido: si viene {@code Authorization: Bearer <token>} y el
 * token es válido, busca al usuario y lo deja autenticado para el resto del pedido.
 * Se vuelve a leer el usuario de la base para que un empleado dado de baja
 * pierda el acceso en el momento, aunque su token todavía no haya vencido.
 *
 * No es un @Component a propósito: se crea en SecurityConfig, así Spring Boot no
 * lo registra dos veces (una como filtro de servlet y otra en la cadena de seguridad).
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String PREFIJO = "Bearer ";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(PREFIJO)
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwtService.obtenerUsuarioId(header.substring(PREFIJO.length()))
                    .flatMap(usuarioRepository::findById)
                    .filter(Usuario::isActivo)
                    .ifPresent(usuario -> autenticar(usuario, request));
        }
        chain.doFilter(request, response);
    }

    private void autenticar(Usuario usuario, HttpServletRequest request) {
        UsuarioAutenticado principal = UsuarioAutenticado.desde(usuario);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
