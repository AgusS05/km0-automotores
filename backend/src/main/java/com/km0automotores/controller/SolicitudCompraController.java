package com.km0automotores.controller;

import com.km0automotores.dto.compra.CambioEstadoSolicitudRequest;
import com.km0automotores.dto.compra.CondicionesCompraDto;
import com.km0automotores.dto.compra.SolicitudCompraDto;
import com.km0automotores.dto.compra.SolicitudCompraRequest;
import com.km0automotores.model.EstadoSolicitud;
import com.km0automotores.security.UsuarioAutenticado;
import com.km0automotores.service.SolicitudCompraService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Solicitudes de compra", description = "Interés de compra de un cliente y presupuesto orientativo (sin pagos online)")
@RestController
@RequestMapping("/api/solicitudes-compra")
public class SolicitudCompraController {

    private final SolicitudCompraService service;

    public SolicitudCompraController(SolicitudCompraService service) {
        this.service = service;
    }

    // -------------------------------------------------------- público

    @Operation(summary = "Condiciones de financiación de referencia", description = "TNA, plazos y anticipo mínimo para simular la cuota.")
    @GetMapping("/condiciones")
    public CondicionesCompraDto condiciones() {
        return service.condiciones();
    }

    // -------------------------------------------------------- cliente

    @Operation(summary = "Crear solicitud de compra (cliente)",
            description = "Asigna un vendedor de la sucursal y calcula el presupuesto. 409 si ya hay una abierta de esa versión; 422 si la financiación no cumple las condiciones.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLIENTE')")
    public SolicitudCompraDto crear(@Valid @RequestBody SolicitudCompraRequest req,
                                    @AuthenticationPrincipal UsuarioAutenticado yo) {
        return service.crear(req, yo.getId());
    }

    @Operation(summary = "Mis solicitudes de compra (cliente)")
    @GetMapping("/mias")
    @PreAuthorize("hasRole('CLIENTE')")
    public List<SolicitudCompraDto> mias(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return service.delCliente(yo.getId());
    }

    @Operation(summary = "Cancelar mi solicitud (cliente)", description = "Solo mientras está nueva o contactada.")
    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('CLIENTE')")
    public SolicitudCompraDto cancelar(@PathVariable Integer id, @AuthenticationPrincipal UsuarioAutenticado yo) {
        return service.cancelarPorCliente(id, yo.getId());
    }

    // -------------------------------------------------------- cliente dueño, vendedor asignado o admin

    @Operation(summary = "Ver una solicitud (presupuesto)", description = "La ve el cliente que la hizo, el vendedor asignado o un administrador.")
    @GetMapping("/{id}")
    public SolicitudCompraDto obtener(@PathVariable Integer id, @AuthenticationPrincipal UsuarioAutenticado yo) {
        return service.obtener(id, yo);
    }

    // -------------------------------------------------------- vendedor / admin

    @Operation(summary = "Listar solicitudes (vendedor/admin)", description = "El vendedor ve las suyas; el admin todas y puede filtrar por sucursal.")
    @GetMapping
    @PreAuthorize("hasAnyRole('VENDEDOR', 'ADMIN')")
    public List<SolicitudCompraDto> listar(@RequestParam(required = false) EstadoSolicitud estado,
                                           @RequestParam(required = false) Integer sucursalId,
                                           @AuthenticationPrincipal UsuarioAutenticado yo) {
        return service.listar(estado, sucursalId, yo);
    }

    @Operation(summary = "Cambiar estado (vendedor/admin)",
            description = "NUEVA → CONTACTADA/DESCARTADA; CONTACTADA → RESERVADA/VENDIDA/DESCARTADA; RESERVADA → VENDIDA/DESCARTADA.")
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('VENDEDOR', 'ADMIN')")
    public SolicitudCompraDto cambiarEstado(@PathVariable Integer id, @Valid @RequestBody CambioEstadoSolicitudRequest req,
                                            @AuthenticationPrincipal UsuarioAutenticado yo) {
        return service.cambiarEstado(id, req.estado(), yo);
    }
}
