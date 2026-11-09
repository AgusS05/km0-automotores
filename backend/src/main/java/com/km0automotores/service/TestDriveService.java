package com.km0automotores.service;

import com.km0automotores.config.AppProperties;
import com.km0automotores.dto.turno.DisponibilidadDto;
import com.km0automotores.dto.turno.HorarioDto;
import com.km0automotores.dto.turno.ReservaTestDriveRequest;
import com.km0automotores.dto.turno.TurnoTestDriveDto;
import com.km0automotores.exception.AccesoDenegadoException;
import com.km0automotores.exception.ConflictoException;
import com.km0automotores.exception.RecursoNoEncontradoException;
import com.km0automotores.exception.ReglaNegocioException;
import com.km0automotores.mapper.TurnoMapper;
import com.km0automotores.model.EstadoTurno;
import com.km0automotores.model.Rol;
import com.km0automotores.model.Sucursal;
import com.km0automotores.model.TurnoTestDrive;
import com.km0automotores.model.Usuario;
import com.km0automotores.model.VehiculoDemo;
import com.km0automotores.repository.ClaseManejoRepository;
import com.km0automotores.repository.ModeloRepository;
import com.km0automotores.repository.OcupacionTestDrive;
import com.km0automotores.repository.TurnoTestDriveRepository;
import com.km0automotores.repository.UsuarioRepository;
import com.km0automotores.repository.VehiculoDemoRepository;
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
 * Reservas de test drive.
 *
 * Cómo se decide si un horario está libre (modelo M, sucursal S, día D, hora H):
 *   1. La sucursal atiende ese día y H está dentro de su horario (CalculadoraHorarios).
 *   2. Hay al menos una unidad demo de M en S que no tiene turno a la hora H.
 *   3. Hay al menos un vendedor de S que no tiene turno a la hora H.
 * Al reservar se asigna la primera unidad libre y el vendedor libre con menos
 * turnos ese día (reparte el trabajo). La base, con sus índices únicos parciales,
 * es la última garantía de que no haya dos reservas iguales aunque lleguen a la vez.
 */
@Service
public class TestDriveService {

    private static final int MAX_DIAS_AGENDA = 62;

    private final TurnoTestDriveRepository turnoRepository;
    private final ClaseManejoRepository claseRepository;
    private final VehiculoDemoRepository vehiculoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ModeloRepository modeloRepository;
    private final SucursalService sucursalService;
    private final AppProperties.Turnos config;
    private final Clock clock;

    public TestDriveService(TurnoTestDriveRepository turnoRepository, ClaseManejoRepository claseRepository,
                            VehiculoDemoRepository vehiculoRepository, UsuarioRepository usuarioRepository,
                            ModeloRepository modeloRepository, SucursalService sucursalService,
                            AppProperties props, Clock clock) {
        this.turnoRepository = turnoRepository;
        this.claseRepository = claseRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.usuarioRepository = usuarioRepository;
        this.modeloRepository = modeloRepository;
        this.sucursalService = sucursalService;
        this.config = props.turnos();
        this.clock = clock;
    }

    // ------------------------------------------------------------------ consulta

    /**
     * Calcula qué horarios de un día se pueden reservar para probar un modelo en una sucursal.
     *
     * <p>Para cada bloque de una hora: {@code lugares = min(unidades libres, vendedores libres)}.
     * Los horarios pasados o que empiezan en menos de una hora se devuelven como no disponibles.</p>
     *
     * @param modeloId   modelo que se quiere probar
     * @param sucursalId sucursal donde está la unidad demo
     * @param fecha      día consultado
     * @return los horarios del día, o un motivo (ej. "La sucursal no atiende ese día") si no hay ninguno
     * @throws RecursoNoEncontradoException si el modelo o la sucursal no existen
     */
    @Transactional(readOnly = true)
    public DisponibilidadDto disponibilidad(Integer modeloId, Integer sucursalId, LocalDate fecha) {
        validarModelo(modeloId);
        Sucursal sucursal = sucursalService.buscar(sucursalId);
        HorarioAtencion horario = SucursalService.horarioDe(sucursal);
        LocalDateTime ahora = LocalDateTime.now(clock);

        String motivo = motivoSinAtencion(horario, fecha, ahora.toLocalDate());
        if (motivo != null) {
            return new DisponibilidadDto(fecha, sucursalId, List.of(), motivo);
        }
        List<VehiculoDemo> unidades = vehiculoRepository.findDisponibles(modeloId, sucursalId);
        if (unidades.isEmpty()) {
            return new DisponibilidadDto(fecha, sucursalId, List.of(),
                    "Este modelo no tiene unidades para test drive en esa sucursal.");
        }
        List<Usuario> vendedores = usuarioRepository.findActivosPorRolYSucursal(Rol.VENDEDOR, sucursalId);
        if (vendedores.isEmpty()) {
            return new DisponibilidadDto(fecha, sucursalId, List.of(),
                    "No hay vendedores asignados a esa sucursal.");
        }

        Map<LocalTime, List<OcupacionTestDrive>> ocupacion = ocupacionPorHora(fecha, sucursalId);
        List<HorarioDto> horarios = new ArrayList<>();
        for (LocalTime hora : CalculadoraHorarios.horariosDelDia(horario, fecha, config.duracionMinutos())) {
            List<OcupacionTestDrive> enEseHorario = ocupacion.getOrDefault(hora, List.of());
            int lugares = Math.min(
                    unidadesLibres(unidades, enEseHorario).size(),
                    vendedoresLibres(vendedores, enEseHorario).size());
            boolean alAlcance = CalculadoraHorarios.estaAlAlcance(fecha, hora, ahora, config.anticipacionMinimaMinutos());
            horarios.add(new HorarioDto(hora, alAlcance && lugares > 0, alAlcance ? lugares : 0));
        }
        return new DisponibilidadDto(fecha, sucursalId, horarios, null);
    }

    // ------------------------------------------------------------------ reserva

    /**
     * Reserva un test drive asignando automáticamente la unidad demo y el vendedor.
     *
     * <p>Se elige la primera unidad libre del modelo y el vendedor libre con menos turnos
     * ese día. El INSERT se ejecuta con {@code saveAndFlush}: si otro cliente tomó el mismo
     * horario un instante antes, el índice único parcial de PostgreSQL lo rechaza y la API
     * responde 409.</p>
     *
     * @param req       modelo, sucursal, día, hora y observaciones
     * @param clienteId id del cliente logueado
     * @return el turno creado en estado PENDIENTE, con unidad y vendedor asignados
     * @throws ReglaNegocioException si el horario no es válido (pasado, domingo, fuera de horario,
     *                               más de 30 días) o el cliente ya tiene otro turno a esa hora
     * @throws ConflictoException    si ya no quedan unidades o vendedores libres en ese horario
     */
    @Transactional
    public TurnoTestDriveDto reservar(ReservaTestDriveRequest req, Integer clienteId) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RecursoNoEncontradoException("El usuario", clienteId));
        validarModelo(req.modeloId());
        Sucursal sucursal = sucursalService.buscar(req.sucursalId());
        LocalDateTime ahora = LocalDateTime.now(clock);

        CalculadoraHorarios.validarReserva(SucursalService.horarioDe(sucursal), req.fecha(), req.horaInicio(), ahora,
                        config.duracionMinutos(), config.anticipacionMinimaMinutos(), config.diasMaximosAdelanto())
                .ifPresent(motivo -> {
                    throw new ReglaNegocioException(motivo);
                });

        if (turnoRepository.clienteOcupado(clienteId, req.fecha(), req.horaInicio(), EstadoTurno.CANCELADO)
                || claseRepository.clienteOcupado(clienteId, req.fecha(), req.horaInicio(), EstadoTurno.CANCELADO)) {
            throw new ReglaNegocioException("Ya tenés otro turno reservado en ese horario.");
        }

        List<VehiculoDemo> unidades = vehiculoRepository.findDisponibles(req.modeloId(), req.sucursalId());
        if (unidades.isEmpty()) {
            throw new ReglaNegocioException("Este modelo no tiene unidades para test drive en esa sucursal.");
        }
        List<OcupacionTestDrive> ocupacionDelDia =
                turnoRepository.findOcupacionDelDia(req.fecha(), req.sucursalId(), EstadoTurno.CANCELADO);
        List<OcupacionTestDrive> enEseHorario = ocupacionDelDia.stream()
                .filter(o -> o.hora().equals(req.horaInicio()))
                .toList();

        VehiculoDemo unidad = unidadesLibres(unidades, enEseHorario).stream().findFirst()
                .orElseThrow(() -> new ConflictoException("Ya no quedan unidades libres en ese horario. Elegí otro."));

        List<Usuario> vendedores = usuarioRepository.findActivosPorRolYSucursal(Rol.VENDEDOR, req.sucursalId());
        Map<Integer, Long> turnosPorVendedor = ocupacionDelDia.stream()
                .collect(Collectors.groupingBy(OcupacionTestDrive::vendedorId, Collectors.counting()));
        Usuario vendedor = vendedoresLibres(vendedores, enEseHorario).stream()
                .min(Comparator.comparingLong((Usuario v) -> turnosPorVendedor.getOrDefault(v.getId(), 0L))
                        .thenComparing(Usuario::getId))
                .orElseThrow(() -> new ConflictoException("No hay vendedores libres en ese horario. Elegí otro."));

        TurnoTestDrive turno = new TurnoTestDrive(cliente, unidad, vendedor, req.fecha(), req.horaInicio(),
                req.horaInicio().plusMinutes(config.duracionMinutos()));
        turno.setObservaciones(AuthService.textoOpcional(req.observaciones()));
        // saveAndFlush: el INSERT se ejecuta ya, así si otro cliente ganó el horario
        // por milisegundos, el índice único falla acá y se responde 409.
        turnoRepository.saveAndFlush(turno);
        return TurnoMapper.toTurnoDto(turno);
    }

    // ------------------------------------------------------------------ cliente

    /**
     * Test drives del cliente, del más reciente al más antiguo.
     */
    @Transactional(readOnly = true)
    public List<TurnoTestDriveDto> turnosDelCliente(Integer clienteId) {
        return turnoRepository.findDelCliente(clienteId).stream().map(TurnoMapper::toTurnoDto).toList();
    }

    /**
     * El cliente cancela su test drive (solo antes de que empiece). El horario queda libre.
     * @throws AccesoDenegadoException si el turno no es del cliente
     * @throws ReglaNegocioException si ya empezó o ya estaba en un estado final
     */
    @Transactional
    public TurnoTestDriveDto cancelarPorCliente(Integer turnoId, Integer clienteId) {
        TurnoTestDrive turno = buscar(turnoId);
        if (!turno.getCliente().getId().equals(clienteId)) {
            throw new AccesoDenegadoException("Ese turno no es tuyo.");
        }
        ReglasTurno.validarCancelacionCliente(turno.getEstado(), inicio(turno), LocalDateTime.now(clock))
                .ifPresent(motivo -> {
                    throw new ReglaNegocioException(motivo);
                });
        turno.setEstado(EstadoTurno.CANCELADO);
        return TurnoMapper.toTurnoDto(turno);
    }

    // ------------------------------------------------------------------ empleados

    /**
     * Cambia el estado de un turno (confirmar, realizado, ausente, cancelar).
     *
     * <p>El vendedor solo puede modificar sus turnos; el administrador, cualquiera.
     * Las transiciones válidas están en {@link EstadoTurno} y REALIZADO/AUSENTE solo
     * se pueden marcar una vez que el turno empezó.</p>
     *
     * @throws AccesoDenegadoException si el vendedor no es el asignado
     * @throws ReglaNegocioException si la transición no está permitida
     */
    @Transactional
    public TurnoTestDriveDto cambiarEstado(Integer turnoId, EstadoTurno nuevo, UsuarioAutenticado yo) {
        TurnoTestDrive turno = buscar(turnoId);
        if (!yo.esAdmin() && !turno.getVendedor().getId().equals(yo.getId())) {
            throw new AccesoDenegadoException("Solo el vendedor asignado o un administrador pueden modificar este turno.");
        }
        ReglasTurno.validarCambioEstado(turno.getEstado(), nuevo, inicio(turno), LocalDateTime.now(clock))
                .ifPresent(motivo -> {
                    throw new ReglaNegocioException(motivo);
                });
        turno.setEstado(nuevo);
        return TurnoMapper.toTurnoDto(turno);
    }

    /**
     * Agenda de test drives entre dos fechas (máximo 62 días).
     * El vendedor ve solo la suya; el administrador ve todas y puede filtrar por vendedor o sucursal.
     */
    @Transactional(readOnly = true)
    public List<TurnoTestDriveDto> agenda(LocalDate desde, LocalDate hasta, Integer vendedorId,
                                         Integer sucursalId, UsuarioAutenticado yo) {
        validarRango(desde, hasta);
        Integer filtroVendedor = yo.esAdmin() ? vendedorId : yo.getId();
        return turnoRepository.findAgenda(desde, hasta, filtroVendedor, sucursalId).stream()
                .map(TurnoMapper::toTurnoDto)
                .toList();
    }

    /**
     * Turnos PENDIENTES de hoy a pasado mañana: los clientes a los que hay que llamar para confirmar.
     * El vendedor ve los suyos; el administrador, todos.
     */
    @Transactional(readOnly = true)
    public List<TurnoTestDriveDto> alertas(UsuarioAutenticado yo) {
        LocalDate hoy = LocalDate.now(clock);
        Integer filtroVendedor = yo.esAdmin() ? null : yo.getId();
        return turnoRepository.findAgenda(hoy, hoy.plusDays(2), filtroVendedor, null).stream()
                .filter(t -> t.getEstado() == EstadoTurno.PENDIENTE)
                .map(TurnoMapper::toTurnoDto)
                .toList();
    }

    // ------------------------------------------------------------------ auxiliares

    static String motivoSinAtencion(HorarioAtencion horario, LocalDate fecha, LocalDate hoy) {
        if (fecha.isBefore(hoy)) {
            return "Esa fecha ya pasó.";
        }
        if (CalculadoraHorarios.cierreDelDia(horario, fecha).isEmpty()) {
            return "La sucursal no atiende ese día.";
        }
        return null;
    }

    static void validarRango(LocalDate desde, LocalDate hasta) {
        if (hasta.isBefore(desde)) {
            throw new ReglaNegocioException("La fecha 'hasta' no puede ser anterior a 'desde'.");
        }
        if (desde.plusDays(MAX_DIAS_AGENDA).isBefore(hasta)) {
            throw new ReglaNegocioException("El rango máximo de la agenda es de " + MAX_DIAS_AGENDA + " días.");
        }
    }

    private void validarModelo(Integer modeloId) {
        if (!modeloRepository.existsById(modeloId)) {
            throw new RecursoNoEncontradoException("El modelo", modeloId);
        }
    }

    private TurnoTestDrive buscar(Integer id) {
        return turnoRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("El turno", id));
    }

    private Map<LocalTime, List<OcupacionTestDrive>> ocupacionPorHora(LocalDate fecha, Integer sucursalId) {
        return turnoRepository.findOcupacionDelDia(fecha, sucursalId, EstadoTurno.CANCELADO).stream()
                .collect(Collectors.groupingBy(OcupacionTestDrive::hora));
    }

    private static List<VehiculoDemo> unidadesLibres(List<VehiculoDemo> unidades, List<OcupacionTestDrive> ocupados) {
        Set<Integer> ocupadas = ocupados.stream().map(OcupacionTestDrive::vehiculoId).collect(Collectors.toSet());
        return unidades.stream().filter(u -> !ocupadas.contains(u.getId())).toList();
    }

    private static List<Usuario> vendedoresLibres(List<Usuario> vendedores, List<OcupacionTestDrive> ocupados) {
        Set<Integer> ocupadosIds = ocupados.stream().map(OcupacionTestDrive::vendedorId).collect(Collectors.toSet());
        return vendedores.stream().filter(v -> !ocupadosIds.contains(v.getId())).toList();
    }

    private static LocalDateTime inicio(TurnoTestDrive t) {
        return t.getFecha().atTime(t.getHoraInicio());
    }
}
