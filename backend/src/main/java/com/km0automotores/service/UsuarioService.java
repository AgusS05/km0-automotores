package com.km0automotores.service;

import com.km0automotores.dto.admin.EmpleadoRequest;
import com.km0automotores.dto.auth.UsuarioDto;
import com.km0automotores.exception.ConflictoException;
import com.km0automotores.exception.RecursoNoEncontradoException;
import com.km0automotores.exception.ReglaNegocioException;
import com.km0automotores.mapper.UsuarioMapper;
import com.km0automotores.model.Rol;
import com.km0automotores.model.Usuario;
import com.km0automotores.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;

/** Gestión de empleados y consulta de clientes (solo administradores). */
@Service
@Transactional
public class UsuarioService {

    private static final int LARGO_MINIMO_PASSWORD = 8;

    private final UsuarioRepository usuarioRepository;
    private final SucursalService sucursalService;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, SucursalService sucursalService,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.sucursalService = sucursalService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Lista empleados (vendedores, instructores y administradores) o clientes.
     * @param empleados true para empleados, false para clientes
     */
    @Transactional(readOnly = true)
    public List<UsuarioDto> listar(boolean empleados) {
        EnumSet<Rol> roles = empleados ? EnumSet.of(Rol.ADMIN, Rol.VENDEDOR, Rol.INSTRUCTOR) : EnumSet.of(Rol.CLIENTE);
        return usuarioRepository.findByRolIn(roles).stream().map(UsuarioMapper::toDto).toList();
    }

    /**
     * Da de alta un empleado con contraseña inicial.
     * @throws ConflictoException si el email ya existe
     * @throws ReglaNegocioException si es vendedor o instructor y no tiene sucursal
     */
    public UsuarioDto crearEmpleado(EmpleadoRequest req) {
        validarRolEmpleado(req);
        String email = AuthService.normalizarEmail(req.email());
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictoException("Ya existe un usuario con ese email.");
        }
        if (req.password() == null || req.password().length() < LARGO_MINIMO_PASSWORD) {
            throw new ReglaNegocioException("La contraseña debe tener al menos " + LARGO_MINIMO_PASSWORD + " caracteres.");
        }
        Usuario u = new Usuario(req.nombre().trim(), req.apellido().trim(), email,
                passwordEncoder.encode(req.password()), req.rol());
        completar(u, req);
        return UsuarioMapper.toDto(usuarioRepository.save(u));
    }

    /**
     * Modifica los datos de un empleado. La contraseña solo cambia si se envía una nueva.
     */
    public UsuarioDto editarEmpleado(Integer id, EmpleadoRequest req) {
        Usuario u = buscar(id);
        if (!u.getRol().esEmpleado()) {
            throw new ReglaNegocioException("Los datos de los clientes los edita cada cliente desde su cuenta.");
        }
        validarRolEmpleado(req);
        String email = AuthService.normalizarEmail(req.email());
        if (!u.getEmail().equalsIgnoreCase(email) && usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictoException("Ya existe un usuario con ese email.");
        }
        u.setNombre(req.nombre().trim());
        u.setApellido(req.apellido().trim());
        u.setEmail(email);
        u.setRol(req.rol());
        if (req.password() != null && !req.password().isBlank()) {
            if (req.password().length() < LARGO_MINIMO_PASSWORD) {
                throw new ReglaNegocioException("La contraseña debe tener al menos " + LARGO_MINIMO_PASSWORD + " caracteres.");
            }
            u.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        completar(u, req);
        return UsuarioMapper.toDto(u);
    }

    /**
     * Da de baja o reactiva un usuario sin borrarlo, para conservar el historial de turnos.
     * @throws ReglaNegocioException si el administrador intenta desactivarse a sí mismo
     */
    public UsuarioDto cambiarActivo(Integer id, boolean activo, Integer adminId) {
        if (id.equals(adminId) && !activo) {
            throw new ReglaNegocioException("No podés desactivar tu propia cuenta.");
        }
        Usuario u = buscar(id);
        u.setActivo(activo);
        return UsuarioMapper.toDto(u);
    }

    private void completar(Usuario u, EmpleadoRequest req) {
        u.setTelefono(AuthService.textoOpcional(req.telefono()));
        boolean necesitaSucursal = req.rol() == Rol.VENDEDOR || req.rol() == Rol.INSTRUCTOR;
        u.setSucursal(req.sucursalId() == null ? null : sucursalService.buscar(req.sucursalId()));
        if (necesitaSucursal && u.getSucursal() == null) {
            throw new ReglaNegocioException("Vendedores e instructores deben tener una sucursal asignada.");
        }
    }

    private static void validarRolEmpleado(EmpleadoRequest req) {
        if (!req.rol().esEmpleado()) {
            throw new ReglaNegocioException("Los clientes se registran solos desde la web.");
        }
    }

    private Usuario buscar(Integer id) {
        return usuarioRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("El usuario", id));
    }
}
