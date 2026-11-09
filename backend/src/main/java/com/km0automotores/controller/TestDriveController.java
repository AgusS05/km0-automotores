package com.km0automotores.controller;

import com.km0automotores.dto.turno.CambioEstadoRequest;
import com.km0automotores.dto.turno.DisponibilidadDto;
import com.km0automotores.dto.turno.ReservaTestDriveRequest;
import com.km0automotores.dto.turno.TurnoTestDriveDto;
import com.km0automotores.security.UsuarioAutenticado;
import com.km0automotores.service.TestDriveService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Test drives", description = "Disponibilidad, reserva y gestión de turnos de test drive")
@RestController
@RequestMapping("/api/test-drives")
public class TestDriveController {

    private final TestDriveService testDriveService;

    public TestDriveController(TestDriveService testDriveService) {
        this.testDriveService = testDriveService;
    }

    /** Público: horarios de un día para un modelo en una sucursal. */
    @Operation(summary = "Horarios disponibles", description = "Bloques de una hora del día con los lugares libres. Si no hay atención ese día, 'motivo' explica por qué.")
    @GetMapping("/disponibilidad")
    public DisponibilidadDto disponibilidad(@RequestParam Integer modeloId,
                                            @RequestParam Integer sucursalId,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return testDriveService.disponibilidad(modeloId, sucursalId, fecha);
    }

    // -------------------------------------------------------- cliente

    @Operation(summary = "Reservar test drive (cliente)", description = "Asigna unidad y vendedor automáticamente. 409 si el horario se ocupó; 422 si no cumple las reglas (domingo, pasado, fuera de horario).")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLIENTE')")
    public TurnoTestDriveDto reservar(@Valid @RequestBody ReservaTestDriveRequest req,
                                      @AuthenticationPrincipal UsuarioAutenticado yo) {
        return testDriveService.reservar(req, yo.getId());
    }

    @Operation(summary = "Mis test drives (cliente)")
    @GetMapping("/mios")
    @PreAuthorize("hasRole('CLIENTE')")
    public List<TurnoTestDriveDto> misTurnos(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return testDriveService.turnosDelCliente(yo.getId());
    }

    @Operation(summary = "Cancelar mi test drive (cliente)", description = "Solo antes de que empiece. Libera el horario.")
    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('CLIENTE')")
    public TurnoTestDriveDto cancelar(@PathVariable Integer id, @AuthenticationPrincipal UsuarioAutenticado yo) {
        return testDriveService.cancelarPorCliente(id, yo.getId());
    }

    // -------------------------------------------------------- vendedor / admin

    @Operation(summary = "Agenda (vendedor/admin)", description = "El vendedor ve la suya; el admin puede filtrar por vendedor o sucursal. Máximo 62 días.")
    @GetMapping("/agenda")
    @PreAuthorize("hasAnyRole('VENDEDOR', 'ADMIN')")
    public List<TurnoTestDriveDto> agenda(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                          @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                                          @RequestParam(required = false) Integer vendedorId,
                                          @RequestParam(required = false) Integer sucursalId,
                                          @AuthenticationPrincipal UsuarioAutenticado yo) {
        return testDriveService.agenda(desde, hasta, vendedorId, sucursalId, yo);
    }

    /** Pendientes de confirmar de hoy a pasado mañana. */
    @Operation(summary = "Turnos a confirmar (vendedor/admin)", description = "Pendientes de hoy a pasado mañana.")
    @GetMapping("/alertas")
    @PreAuthorize("hasAnyRole('VENDEDOR', 'ADMIN')")
    public List<TurnoTestDriveDto> alertas(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return testDriveService.alertas(yo);
    }

    @Operation(summary = "Cambiar estado (vendedor/admin)", description = "PENDIENTE → CONFIRMADO/CANCELADO; CONFIRMADO → REALIZADO/AUSENTE/CANCELADO.")
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('VENDEDOR', 'ADMIN')")
    public TurnoTestDriveDto cambiarEstado(@PathVariable Integer id, @Valid @RequestBody CambioEstadoRequest req,
                                           @AuthenticationPrincipal UsuarioAutenticado yo) {
        return testDriveService.cambiarEstado(id, req.estado(), yo);
    }
}
