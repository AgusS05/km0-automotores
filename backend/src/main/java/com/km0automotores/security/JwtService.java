package com.km0automotores.security;

import com.km0automotores.config.AppProperties;
import com.km0automotores.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.Optional;

/**
 * Genera y valida los tokens JWT.
 * El token guarda el id del usuario ("sub"), su email y su rol, firmado con
 * HMAC-SHA256. Si alguien lo modifica, la firma deja de coincidir y se rechaza.
 */
@Service
public class JwtService {

    private final SecretKey clave;
    private final long expiracionMs;

    public JwtService(AppProperties props) {
        byte[] bytes = props.jwt().secreto().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secreto (JWT_SECRET) debe tener al menos 32 caracteres");
        }
        this.clave = Keys.hmacShaKeyFor(bytes);
        this.expiracionMs = Duration.ofHours(props.jwt().expiracionHoras()).toMillis();
    }

    /**
     * Genera un token firmado (HMAC-SHA) con el id del usuario como subject y su email y rol
     * como claims. Vence a las {@code app.jwt.expiracion-horas} horas.
     * @param usuario usuario autenticado
     * @return el token en formato compacto, para enviar como {@code Authorization: Bearer <token>}
     */
    public String generarToken(Usuario usuario) {
        Date ahora = new Date();
        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("email", usuario.getEmail())
                .claim("rol", usuario.getRol().name())
                .issuedAt(ahora)
                .expiration(new Date(ahora.getTime() + expiracionMs))
                .signWith(clave)
                .compact();
    }

    /** Devuelve el id del usuario si el token es válido y no venció; vacío en cualquier otro caso. */
    public Optional<Integer> obtenerUsuarioId(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(clave).build().parseSignedClaims(token).getPayload();
            return Optional.of(Integer.valueOf(claims.getSubject()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
