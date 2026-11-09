package com.km0automotores.service;

import com.km0automotores.config.AppProperties;
import com.km0automotores.dto.clase.ClaseManejoDto;
import com.km0automotores.dto.clase.ReservaClaseRequest;
import com.km0automotores.dto.sucursal.SucursalDto;
import com.km0automotores.dto.turno.DisponibilidadDto;
import com.km0automotores.dto.turno.HorarioDto;
import com.km0automotores.dto.turno.PersonaDto;
import com.km0automotores.exception.AccesoDenegadoException;
import com.km0automotores.exception.ConflictoException;
import com.km0automotores.exception.RecursoNoEncontradoException;
import com.km0automotores.exception.ReglaNegocioException;
import com.km0automotores.mapper.CatalogoMapper;
import com.km0automotores.mapper.TurnoMapper;
import com.km0automotores.model.ClaseManejo;
import com.km0automotores.model.EstadoTurno;
import com.km0automotores.model.Rol;
import com.km0automotores.model.Sucursal;
import com.km0automotores.model.Usuario;
import com.km0automotores.repository.ClaseManejoRepository;
import com.km0automotores.repository.OcupacionClase;
import com.km0automotores.repository.TurnoTestDriveRepository;
import com.km0automotores.repository.UsuarioRepository;
import com.km0automotores.security.UsuarioAutenticado;
import com.km0automotores.service.reglas.CalculadoraHorarios;
import com.km0automotores.service.reglas.HorarioAtencion;
import com.km0automotores.service.reglas.ReglasTurno;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Escuela de manejo: misma lógica que el test drive, pero el recurso limitado
 * es el instructor (cada uno da una clase por horario). El cliente puede elegir
 * instructor o dejar que el sistema asigne el que tenga menos clases ese día.
 */
@Service
public class ClaseManejoService {

    private final ClaseManejoRepository claseRepository;
    private final TurnoTestDriveRepository turnoRepository;
    private final UsuarioRepository usuarioRepository;
    private final SucursalService sucursalService;
    private final AppProperties.Turnos config;
    private final Clock clock;

    public ClaseManejoService(ClaseManejoRepository claseRepository, TurnoTestDriveRepository turnoRepository,
                              UsuarioRepository usuarioRepository, SucursalService sucursalService,
                              AppProperties props, Clock clock) {
        this.claseRepository = claseRepository;
        this.turnoRepository = turnoRepository;
        this.usuarioRepository = usuarioRepository;
        this.sucursalService = sucursalService;
        this.config = props.turnos();
        this.clock = clock;
    }

    // ------------------------------------------------------------------ consulta

    /** Sucursales que tienen escuela de manejo (al menos un instructor activo). */
    @Transactional(readOnly = true)
    public List<SucursalDto> sucursalesConEscuela() {
        return usuarioRepository.findSucursalesConRol(Rol.INSTRUCTOR).stream()
                .sorted(Comparator.comparing(Sucursal::getId))
                .map(CatalogoMapper::toSucursalDto)
                .toList();
    }

    /**
     * Instructores activos de una sucursal, para que el cliente pueda elegir uno.
     */
    @Transactional(readOnly = true)
    public List<PersonaDto> instructores(Integer sucursalId) {
        return usuarioRepository.findActivosPorRolYSucursal(Rol.INSTRUCTOR, sucursalId).stream()
                .map(TurnoMapper::toPersona)
                .toList();
    }

    /**
     * Calcula los horarios de un día para tomar una clase en una sucursal.
     *
     * <p>Cada bloque tiene tantos lugares como instructores libres a esa hora
     * (o 0/1 si se pidió un instructor en particular).</p>
     *
     * @param sucursalId   sucursal con escuela de manejo
     * @param fecha        día consultado
     * @param instructorId opcional: limitar a un instructor
     * @return horarios del día, o un motivo si ese día no se dictan clases
     */
    @Transactional(readOnly = true)
    public DisponibilidadDto disponibilidad(Integer sucursalId, LocalDate fecha, Integer instructorId) {
        Sucursal sucursal = sucursalService.buscar(sucursalId);
        HorarioAtencion horario = SucursalService.horarioDe(sucursal);
        LocalDateTime ahora = LocalDateTime.now(clock);

        String motivo = TestDriveService.motivoSinAtencion(horario, fecha, ahora.toLocalDate());
        if (motivo != null) {
            return new DisponibilidadDto(fecha, sucursalId, List.of(), motivo);
        }
        List<Usuario> instructores = candidatos(sucursalId, instructorId);
        if (instructores.isEmpty()) {
            return new DisponibilidadDto(fecha, sucursalId, List.of(),
                    "Esta sucursal no tiene instructores de manejo.");
        }

        Map<LocalTime, Set<Integer>> ocupados = claseRepository
                .findOcupacionDelDia(fecha, sucursalId, EstadoTurno.CANCELADO).stream()
                .collect(Collectors.groupingBy(OcupacionClase::hora,
                        Collectors.mapping(OcupacionClase::instructorId, Collectors.toSet())));

        List<HorarioDto> horarios = new ArrayList<>();
        for (LocalTime hora : CalculadoraHorarios.horariosDelDia(horario, fecha, config.duracionMinutos())) {
            Set<Integer> ocupadosEnHora = ocupados.getOrDefault(hora, Set.of());
            int libres = (int) instructores.stream().filter(i -> !ocupadosEnHora.contains(i.getId())).count();
            boolean alAlcance = CalculadoraHorarios.estaAlAlcance(fecha, hora, ahora, config.anticipacionMinimaMinutos());
            horarios.add(new HorarioDto(hora, alAlcance && libres > 0, alAlcance ? libres : 0));
        }
        return new DisponibilidadDto(fecha, sucursalId, horarios, null);
    }

    // ------------------------------------------------------------------ reserva

    /**
     * Reserva una clase de manejo para el cliente.
     *
     * <p>Si el cliente no eligió instructor, se asigna el libre con menos clases ese día.
     * El índice único parcial de la base impide que un instructor tenga dos clases a la
     * misma hora aunque dos pedidos lleguen a la vez.</p>
     *
     * @param req       sucursal, día, hora, tipo de caja e instructor opcional
     * @param clienteId id del cliente logueado
     * @return la clase creada en estado PENDIENTE
     * @throws ReglaNegocioException si el horario no es válido o el cliente ya tiene otro turno a esa hora
     * @throws ConflictoException si ya no quedan instructores libres en ese horario
     */
    @Transactional
    public ClaseManejoDto reservar(ReservaClaseRequest req, Integer clienteId) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RecursoNoEncontradoException("El usuario", clienteId));
        Sucursal sucursal = sucursalService.buscar(req.sucursalId());
        LocalDateTime ahora = LocalDateTime.now(clock);

        CalculadoraHorarios.validarReserva(SucursalService.horarioDe(sucursal), req.fecha(), req.horaInicio(), ahora,
                        config.duracionMinutos(), config.anticipacionMinimaMinutos(), config.diasMaximosAdelanto())
                .ifPresent(motivo -> {
                    throw new ReglaNegocioException(motivo);
                });

        if (claseRepository.clienteOcupado(clienteId, req.fecha(), req.horaInicio(), EstadoTurno.CANCELADO)
                || turnoRepository.clienteOcupado(clienteId, req.fecha(), req.horaInicio(), EstadoTurno.CANCELADO)) {
            throw new ReglaNegocioException("Ya tenés otro turno reservado en ese horario.");
        }

        List<Usuario> instructores = candidatos(req.sucursalId(), req.instructorId());
        if (instructores.isEmpty()) {
            throw new ReglaNegocioException(req.instructorId() == null
                    ? "Esta sucursal no tiene instructores de manejo."
                    : "Ese instructor no da clases en la sucursal elegida.");
        }
        List<OcupacionClase> delDia = claseRepository.findOcupacionDelDia(req.fecha(), req.sucursalId(),
                EstadoTurno.CANCELADO);
        Set<Integer> ocupadosEnHora = delDia.stream()
                .filter(o -> o.hora().equals(req.horaInicio()))
                .map(OcupacionClase::instructorId)
                .collect(Collectors.toSet());
        Map<Integer, Long> clasesPorInstructor = delDia.stream()
                .collect(Collectors.groupingBy(OcupacionClase::instructorId, Collectors.counting()));

        Usuario instructor = instructores.stream()
                .filter(i -> !ocupadosEnHora.contains(i.getId()))
                .min(Comparator.comparingLong((Usuario i) -> clasesPorInstructor.getOrDefault(i.getId(), 0L))
                        .thenComparing(Usuario::getId))
                .orElseThrow(() -> new ConflictoException(req.instructorId() == null
                        ? "No quedan instructores libres en ese horario. Elegí otro."
                        : "Ese instructor ya tiene una clase en ese horario. Elegí otro horario."));

        ClaseManejo clase = new ClaseManejo(cliente, instructor, sucursal, req.fecha(), req.horaInicio(),
                req.horaInicio().plusMinutes(config.duracionMinutos()), req.transmision());
        clase.setObservaciones(AuthService.textoOpcional(req.observaciones()));
        claseRepository.saveAndFlush(clase);
        return TurnoMapper.toClaseDto(clase);
    }

    // ------------------------------------------------------------------ cliente

    /**
     * Clases del cliente, de la más reciente a la más antigua.
     */
    @Transactional(readOnly = true)
    public List<ClaseManejoDto> clasesDelCliente(Integer clienteId) {
        return claseRepository.findDelCliente(clienteId).stream().map(TurnoMapper::toClaseDto).toList();
    }

    /**
     * El cliente cancela su clase (solo antes de que empiece). Libera el horario.
     * @throws AccesoDenegadoException si la clase no es del cliente
     * @throws ReglaNegocioException si ya empezó o ya estaba en un estado final
     */
    @Transactional
    public ClaseManejoDto cancelarPorCliente(Integer claseId, Integer clienteId) {
        ClaseManejo clase = buscar(claseId);
        if (!clase.getCliente().getId().equals(clienteId)) {
            throw new AccesoDenegadoException("Esa clase no es tuya.");
        }
        ReglasTurno.validarCancelacionCliente(clase.getEstado(), inicio(clase), LocalDateTime.now(clock))
                .ifPresent(motivo -> {
                    throw new ReglaNegocioException(motivo);
                });
        clase.setEstado(EstadoTurno.CANCELADO);
        return TurnoMapper.toClaseDto(clase);
    }

    // ------------------------------------------------------------------ empleados

    /**
     * Cambia el estado de una clase (confirmar, realizada, ausente, cancelar).
     *
     * <p>El instructor solo puede modificar sus clases; el administrador, cualquiera.
     * Las transiciones válidas están en {@link EstadoTurno}.</p>
     *
     * @throws AccesoDenegadoException si el instructor no es el asignado
     * @throws ReglaNegocioException si la transición no está permitida
     */
    @Transactional
    public ClaseManejoDto cambiarEstado(Integer claseId, EstadoTurno nuevo, UsuarioAutenticado yo) {
        ClaseManejo clase = buscar(claseId);
        if (!yo.esAdmin() && !clase.getInstructor().getId().equals(yo.getId())) {
            throw new AccesoDenegadoException("Solo el instructor asignado o un administrador pueden modificar esta clase.");
        }
        ReglasTurno.validarCambioEstado(clase.getEstado(), nuevo, inicio(clase), LocalDateTime.now(clock))
                .ifPresent(motivo -> {
                    throw new ReglaNegocioException(motivo);
                });
        clase.setEstado(nuevo);
        return TurnoMapper.toClaseDto(clase);
    }

    /**
     * Agenda de clases entre dos fechas (máximo 62 días).
     * El instructor ve solo la suya; el administrador puede filtrar por instructor o sucursal.
     */
    @Transactional(readOnly = true)
    public List<ClaseManejoDto> agenda(LocalDate desde, LocalDate hasta, Integer instructorId,
                                      Integer sucursalId, UsuarioAutenticado yo) {
        TestDriveService.validarRango(desde, hasta);
        Integer filtroInstructor = yo.esAdmin() ? instructorId : yo.getId();
        return claseRepository.findAgenda(desde, hasta, filtroInstructor, sucursalId).stream()
                .map(TurnoMapper::toClaseDto)
                .toList();
    }

    // ------------------------------------------------------------------ auxiliares

    /** Instructores activos de la sucursal; si se pidió uno en particular, solo ese. */
    private List<Usuario> candidatos(Integer sucursalId, Integer instructorId) {
        List<Usuario> instructores = usuarioRepository.findActivosPorRolYSucursal(Rol.INSTRUCTOR, sucursalId);
        if (instructorId == null) {
            return instructores;
        }
        return instructores.stream().filter(i -> i.getId().equals(instructorId)).toList();
    }

    private ClaseManejo buscar(Integer id) {
        return claseRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("La clase", id));
    }

    private static LocalDateTime inicio(ClaseManejo c) {
        return c.getFecha().atTime(c.getHoraInicio());
    }
}
