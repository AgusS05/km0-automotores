package com.km0automotores.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.km0automotores.dto.comun.ErrorResponse;
import com.km0automotores.repository.UsuarioRepository;
import com.km0automotores.security.JwtAuthFilter;
import com.km0automotores.security.JwtService;
import com.km0automotores.security.UsuarioAutenticado;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Reglas de acceso de la API.
 * - Sin sesión en el servidor (STATELESS): cada pedido trae su token JWT.
 * - Catálogo, sucursales y disponibilidad son públicos (se pueden ver sin cuenta).
 * - /api/admin/** solo para ADMIN. El resto requiere estar logueado, y cada
 *   controlador afina con @PreAuthorize (ej. solo CLIENTE reserva).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService,
                                           UsuarioRepository usuarioRepository,
                                           ObjectMapper objectMapper) throws Exception {
        http
            .csrf(csrf -> csrf.disable())   // no hay cookies de sesión: CSRF no aplica
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/registro").permitAll()
                .requestMatchers(HttpMethod.GET,
                        "/api/marcas/**", "/api/modelos/**", "/api/versiones/**", "/api/sucursales/**",
                        "/api/test-drives/disponibilidad",
                        "/api/clases/disponibilidad", "/api/clases/instructores", "/api/clases/sucursales",
                        "/api/solicitudes-compra/condiciones")
                    .permitAll()
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) ->
                        escribirError(res, req, objectMapper, HttpStatus.UNAUTHORIZED, "Iniciá sesión para continuar."))
                .accessDeniedHandler((req, res, e) ->
                        escribirError(res, req, objectMapper, HttpStatus.FORBIDDEN, "No tenés permisos para esta acción.")))
            .addFilterBefore(new JwtAuthFilter(jwtService, usuarioRepository),
                    UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Carga usuarios por email. Además, al declararlo, Spring Boot no crea el
     * usuario "user" con contraseña aleatoria que trae por defecto.
     */
    @Bean
    public UserDetailsService userDetailsService(UsuarioRepository usuarioRepository) {
        return email -> usuarioRepository.findByEmailIgnoreCase(email)
                .map(UsuarioAutenticado::desde)
                .orElseThrow(() -> new UsernameNotFoundException("No existe el usuario " + email));
    }

    /** Permite que el frontend (otro dominio, ej. Vercel) llame a la API. */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(AppProperties props) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(props.cors().origenesPermitidos());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    private static void escribirError(HttpServletResponse res, HttpServletRequest req, ObjectMapper mapper,
                                      HttpStatus status, String mensaje) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        ErrorResponse body = new ErrorResponse(status.value(), status.getReasonPhrase(), mensaje,
                Map.of(), req.getRequestURI(), LocalDateTime.now());
        mapper.writeValue(res.getOutputStream(), body);
    }
}
