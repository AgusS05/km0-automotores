package com.km0automotores.service;

import com.km0automotores.dto.auth.AuthResponse;
import com.km0automotores.dto.auth.LoginRequest;
import com.km0automotores.dto.auth.RegistroRequest;
import com.km0automotores.dto.auth.UsuarioDto;
import com.km0automotores.exception.ApiException;
import com.km0automotores.exception.ConflictoException;
import com.km0automotores.exception.RecursoNoEncontradoException;
import com.km0automotores.mapper.UsuarioMapper;
import com.km0automotores.model.Rol;
import com.km0automotores.model.Usuario;
import com.km0automotores.repository.UsuarioRepository;
import com.km0automotores.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Registra un cliente nuevo desde la web y lo deja logueado.
     *
     * <p>El email se guarda en minúsculas y la contraseña con BCrypt; los empleados
     * no se registran por acá (los crea el administrador).</p>
     *
     * @param req datos del formulario de registro
     * @return token JWT y datos del usuario creado
     * @throws ConflictoException si el email ya está registrado
     */
    @Transactional
    public AuthResponse registrar(RegistroRequest req) {
        String email = normalizarEmail(req.email());
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictoException("Ya existe una cuenta con ese email.");
        }
        Usuario usuario = new Usuario(req.nombre().trim(), req.apellido().trim(), email,
                passwordEncoder.encode(req.password()), Rol.CLIENTE);
        usuario.setTelefono(textoOpcional(req.telefono()));
        usuarioRepository.save(usuario);
        return new AuthResponse(jwtService.generarToken(usuario), UsuarioMapper.toDto(usuario));
    }

    /**
     * Valida email y contraseña y emite un token JWT.
     *
     * <p>Responde el mismo error exista o no el email, para no revelar qué cuentas
     * están registradas.</p>
     *
     * @param req email y contraseña
     * @return token JWT (válido 24 h) y datos del usuario
     * @throws ApiException 401 si las credenciales no son válidas; 403 si la cuenta está desactivada
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(normalizarEmail(req.email()))
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                // Mismo mensaje si no existe el email o si la clave es incorrecta:
                // así no se revela qué emails están registrados.
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email o contraseña incorrectos."));
        if (!usuario.isActivo()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu cuenta está desactivada. Comunicate con la concesionaria.");
        }
        return new AuthResponse(jwtService.generarToken(usuario), UsuarioMapper.toDto(usuario));
    }

    /**
     * Datos del usuario logueado (los usa el frontend al recargar la página).
     * @param usuarioId id tomado del token
     */
    @Transactional(readOnly = true)
    public UsuarioDto perfil(Integer usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .map(UsuarioMapper::toDto)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", usuarioId));
    }

    static String normalizarEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    static String textoOpcional(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
