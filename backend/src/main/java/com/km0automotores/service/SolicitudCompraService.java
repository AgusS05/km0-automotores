package com.km0automotores.service;

import com.km0automotores.config.ComprasProperties;
import com.km0automotores.dto.compra.CondicionesCompraDto;
import com.km0automotores.dto.compra.SolicitudCompraDto;
import com.km0automotores.dto.compra.SolicitudCompraRequest;
import com.km0automotores.exception.AccesoDenegadoException;
import com.km0automotores.exception.ConflictoException;
import com.km0automotores.exception.RecursoNoEncontradoException;
import com.km0automotores.exception.ReglaNegocioException;
import com.km0automotores.mapper.SolicitudMapper;
import com.km0automotores.model.EstadoSolicitud;
import com.km0automotores.model.FormaPago;
import com.km0automotores.model.Rol;
import com.km0automotores.model.SolicitudCompra;
import com.km0automotores.model.Sucursal;
import com.km0automotores.model.Usuario;
import com.km0automotores.model.VersionModelo;
import com.km0automotores.repository.SolicitudCompraRepository;
import com.km0automotores.repository.UsuarioRepository;
import com.km0automotores.repository.VersionModeloRepository;
import com.km0automotores.security.UsuarioAutenticado;
import com.km0automotores.service.reglas.CalculadoraFinanciacion;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Solicitudes de compra: el cliente muestra interés en una versión, el sistema le asigna
 * un vendedor de la sucursal elegida y arma un presupuesto orientativo. No hay cobro online.
 */
@Service
public class SolicitudCompraService {

    private final SolicitudCompraRepository solicitudRepository;
    private final VersionModeloRepository versionRepository;
    private final UsuarioRepository usuarioRepository;
    private final SucursalService sucursalService;
    private final NotificacionService notificacionService;
    private final ComprasProperties config;

    public SolicitudCompraService(SolicitudCompraRepository solicitudRepository,
                                  VersionModeloRepository versionRepository,
                                  UsuarioRepository usuarioRepository,
                                  SucursalService sucursalService,
                                  NotificacionService notificacionService,
                                  ComprasProperties config) {
        this.solicitudRepository = solicitudRepository;
        this.versionRepository = versionRepository;
        this.usuarioRepository = usuarioRepository;
        this.sucursalService = sucursalService;
        this.notificacionService = notificacionService;
        this.config = config;
    }

    /** Tasa, plazos y anticipo mínimo de referencia, para simular la cuota en pantalla. */
    public CondicionesCompraDto condiciones() {
        return new CondicionesCompraDto(config.tnaReferencia(), config.cuotas(), config.anticipoMinimoPorcentaje());
    }

    /**
     * Registra el interés de compra del cliente.
     *
     * <p>Se guarda una copia del precio de lista. Si paga financiado, se valida el anticipo
     * mínimo y los plazos y se calcula la cuota con {@link CalculadoraFinanciacion}. Se asigna
     * el vendedor activo de la sucursal con menos solicitudes abiertas y se avisa al cliente y
     * al vendedor por email (o al log, si no hay SMTP).</p>
     *
     * @param req       versión, color, sucursal, forma de pago, usado y comentario
     * @param clienteId id del cliente logueado
     * @return la solicitud creada, en estado NUEVA, con el presupuesto calculado
     * @throws ReglaNegocioException si el color no es del modelo, faltan datos del usado
     *                               o la financiación no cumple las condiciones
     * @throws ConflictoException    si el cliente ya tiene una solicitud abierta de esa versión
     */
    @Transactional
    public SolicitudCompraDto crear(SolicitudCompraRequest req, Integer clienteId) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RecursoNoEncontradoException("El usuario", clienteId));
        VersionModelo version = versionRepository.findById(req.versionId())
                .orElseThrow(() -> new RecursoNoEncontradoException("La versión", req.versionId()));
        Sucursal sucursal = sucursalService.buscar(req.sucursalId());

        if (solicitudRepository.existeAbierta(clienteId, version.getId(), EstadoSolicitud.abiertos())) {
            throw new ConflictoException("Ya tenés una solicitud abierta para esta versión. La podés ver en Mis turnos.");
        }

        String color = AuthService.textoOpcional(req.color());
        if (color != null) {
            color = version.getModelo().getColores().stream()
                    .filter(c -> c.getNombre().equalsIgnoreCase(req.color().trim()))
                    .findFirst()
                    .map(c -> c.getNombre())
                    .orElseThrow(() -> new ReglaNegocioException("Ese color no está disponible para este modelo."));
        }

        String usado = AuthService.textoOpcional(req.usadoDescripcion());
        if (req.entregaUsado() && usado == null) {
            throw new ReglaNegocioException("Contanos qué auto entregás: marca, modelo, año y kilómetros.");
        }

        Usuario vendedor = vendedorConMenosSolicitudes(sucursal.getId());
        SolicitudCompra solicitud = new SolicitudCompra(cliente, version, sucursal, vendedor,
                req.formaPago(), version.getPrecio());
        solicitud.setColor(color);
        solicitud.setUsado(req.entregaUsado(), usado);
        solicitud.setComentario(AuthService.textoOpcional(req.comentario()));

        if (req.formaPago() == FormaPago.FINANCIADO) {
            CalculadoraFinanciacion.validar(version.getPrecio(), req.anticipo(), req.cuotas(),
                            config.cuotas(), config.anticipoMinimoPorcentaje())
                    .ifPresent(motivo -> {
                        throw new ReglaNegocioException(motivo);
                    });
            CalculadoraFinanciacion.Simulacion sim = CalculadoraFinanciacion.simular(
                    version.getPrecio(), req.anticipo(), req.cuotas(), config.tnaReferencia());
            solicitud.setFinanciacion(req.anticipo(), req.cuotas(), config.tnaReferencia(), sim.cuota());
        }

        // saveAndFlush: si llegan dos pedidos iguales a la vez, el índice uq_solicitud_abierta rechaza el segundo (409)
        solicitudRepository.saveAndFlush(solicitud);
        avisar(solicitud);
        return SolicitudMapper.toDto(solicitud);
    }

    /** Solicitudes del cliente, de la más nueva a la más vieja. */
    @Transactional(readOnly = true)
    public List<SolicitudCompraDto> delCliente(Integer clienteId) {
        return solicitudRepository.findDelCliente(clienteId).stream().map(SolicitudMapper::toDto).toList();
    }

    /**
     * Una solicitud (el presupuesto). La ve el cliente que la hizo, el vendedor asignado o un administrador.
     * @throws AccesoDenegadoException para cualquier otro usuario
     */
    @Transactional(readOnly = true)
    public SolicitudCompraDto obtener(Integer id, UsuarioAutenticado yo) {
        SolicitudCompra s = buscar(id);
        boolean puedeVer = yo.esAdmin()
                || s.getCliente().getId().equals(yo.getId())
                || s.getVendedor().getId().equals(yo.getId());
        if (!puedeVer) {
            throw new AccesoDenegadoException("No tenés acceso a esta solicitud.");
        }
        return SolicitudMapper.toDto(s);
    }

    /**
     * El cliente desiste de la compra. Solo mientras está NUEVA o CONTACTADA:
     * si ya se reservó la unidad, tiene que hablar con el vendedor.
     */
    @Transactional
    public SolicitudCompraDto cancelarPorCliente(Integer id, Integer clienteId) {
        SolicitudCompra s = buscar(id);
        if (!s.getCliente().getId().equals(clienteId)) {
            throw new AccesoDenegadoException("Esa solicitud no es tuya.");
        }
        if (s.getEstado() != EstadoSolicitud.NUEVA && s.getEstado() != EstadoSolicitud.CONTACTADA) {
            throw new ReglaNegocioException(s.getEstado() == EstadoSolicitud.RESERVADA
                    ? "La unidad ya está reservada: para cancelar, comunicate con tu vendedor."
                    : "Esta solicitud ya está cerrada.");
        }
        s.setEstado(EstadoSolicitud.DESCARTADA);
        return SolicitudMapper.toDto(s);
    }

    /**
     * Listado para la gestión comercial. El vendedor ve las suyas; el administrador, todas
     * (puede filtrar por sucursal). Ambos pueden filtrar por estado.
     */
    @Transactional(readOnly = true)
    public List<SolicitudCompraDto> listar(EstadoSolicitud estado, Integer sucursalId, UsuarioAutenticado yo) {
        Integer vendedorId = yo.esAdmin() ? null : yo.getId();
        return solicitudRepository.findListado(vendedorId, yo.esAdmin() ? sucursalId : null, estado).stream()
                .map(SolicitudMapper::toDto)
                .toList();
    }

    /**
     * Avanza la solicitud en el embudo de venta (contactada, reservada, vendida o descartada).
     * @throws AccesoDenegadoException si el vendedor no es el asignado
     * @throws ReglaNegocioException   si la transición no está permitida (ver {@link EstadoSolicitud})
     */
    @Transactional
    public SolicitudCompraDto cambiarEstado(Integer id, EstadoSolicitud nuevo, UsuarioAutenticado yo) {
        SolicitudCompra s = buscar(id);
        if (!yo.esAdmin() && !s.getVendedor().getId().equals(yo.getId())) {
            throw new AccesoDenegadoException("Solo el vendedor asignado o un administrador pueden modificar esta solicitud.");
        }
        if (!s.getEstado().puedePasarA(nuevo)) {
            throw new ReglaNegocioException("No se puede pasar de " + s.getEstado() + " a " + nuevo + ".");
        }
        s.setEstado(nuevo);
        return SolicitudMapper.toDto(s);
    }

    // ------------------------------------------------------------------ auxiliares

    private SolicitudCompra buscar(Integer id) {
        return solicitudRepository.findDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("La solicitud", id));
    }

    /** Reparte el trabajo: el vendedor activo de la sucursal con menos solicitudes abiertas. */
    private Usuario vendedorConMenosSolicitudes(Integer sucursalId) {
        List<Usuario> vendedores = usuarioRepository.findActivosPorRolYSucursal(Rol.VENDEDOR, sucursalId);
        if (vendedores.isEmpty()) {
            throw new ReglaNegocioException("Esa sucursal no tiene vendedores disponibles. Elegí otra.");
        }
        Map<Integer, Long> abiertas = solicitudRepository.contarAbiertasPorVendedor(EstadoSolicitud.abiertos())
                .stream()
                .collect(Collectors.toMap(f -> (Integer) f[0], f -> (Long) f[1]));
        return vendedores.stream()
                .min(Comparator.comparingLong((Usuario v) -> abiertas.getOrDefault(v.getId(), 0L))
                        .thenComparing(Usuario::getId))
                .orElseThrow();
    }

    private void avisar(SolicitudCompra s) {
        VersionModelo v = s.getVersion();
        String auto = v.getModelo().getMarca().getNombre() + " " + v.getModelo().getNombre() + " " + v.getNombreVersion();
        notificacionService.enviar(s.getCliente().getEmail(),
                "Recibimos tu solicitud de compra #" + s.getId(),
                "Hola " + s.getCliente().getNombre() + ": recibimos tu interés por el " + auto
                        + " (precio de lista " + pesos(s.getPrecioLista()) + "). "
                        + s.getVendedor().getNombreCompleto() + ", de la sucursal " + s.getSucursal().getNombre()
                        + ", te va a contactar para confirmar disponibilidad y condiciones.");
        notificacionService.enviar(s.getVendedor().getEmail(),
                "Nueva solicitud de compra #" + s.getId(),
                s.getCliente().getNombreCompleto() + " quiere comprar el " + auto + " (" + s.getFormaPago() + "). "
                        + "Contactalo: " + s.getCliente().getEmail()
                        + (s.getCliente().getTelefono() != null ? " / " + s.getCliente().getTelefono() : "") + ".");
    }

    private static String pesos(BigDecimal valor) {
        return "$ " + String.format(Locale.forLanguageTag("es-AR"), "%,.0f", valor);
    }
}
