package com.km0automotores.controller;

import com.km0automotores.dto.clase.ClaseManejoDto;
import com.km0automotores.dto.clase.ReservaClaseRequest;
import com.km0automotores.dto.sucursal.SucursalDto;
import com.km0automotores.dto.turno.CambioEstadoRequest;
import com.km0automotores.dto.turno.DisponibilidadDto;
import com.km0automotores.dto.turno.PersonaDto;
import com.km0automotores.security.UsuarioAutenticado;
import com.km0automotores.service.ClaseManejoService;
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

@Tag(name = "Escuela de manejo", description = "Reserva y gestión de clases de manejo")
@RestController
@RequestMapping("/api/clases")
public class ClaseManejoController {

    private final ClaseManejoService claseService;

    public ClaseManejoController(ClaseManejoService claseService) {
        this.claseService = claseService;
    }

    // -------------------------------------------------------- público

    @Operation(summary = "Sucursales con escuela de manejo")
    @GetMapping("/sucursales")
    public List<SucursalDto> sucursalesConEscuela() {
        return claseService.sucursalesConEscuela();
    }

    @Operation(summary = "Instructores de una sucursal")
    @GetMapping("/instructores")
    public List<PersonaDto> instructores(@RequestParam Integer sucursalId) {
        return claseService.instructores(sucursalId);
    }

    @Operation(summary = "Horarios disponibles para clases", description = "Opcionalmente filtrado por instructor.")
    @GetMapping("/disponibilidad")
    public DisponibilidadDto disponibilidad(@RequestParam Integer sucursalId,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                                            @RequestParam(required = false) Integer instructorId) {
        return claseService.disponibilidad(sucursalId, fecha, instructorId);
    }

    // -------------------------------------------------------- cliente

    @Operation(summary = "Reservar clase (cliente)", description = "Si no se elige instructor, se asigna el que tenga menos clases ese día.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLIENTE')")
    public ClaseManejoDto reservar(@Valid @RequestBody ReservaClaseRequest req,
                                   @AuthenticationPrincipal UsuarioAutenticado yo) {
        return claseService.reservar(req, yo.getId());
    }

    @Operation(summary = "Mis clases (cliente)")
    @GetMapping("/mias")
    @PreAuthorize("hasRole('CLIENTE')")
    public List<ClaseManejoDto> misClases(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return claseService.clasesDelCliente(yo.getId());
    }

    @Operation(summary = "Cancelar mi clase (cliente)", description = "Solo antes de que empiece.")
    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('CLIENTE')")
    public ClaseManejoDto cancelar(@PathVariable Integer id, @AuthenticationPrincipal UsuarioAutenticado yo) {
        return claseService.cancelarPorCliente(id, yo.getId());
    }

    // -------------------------------------------------------- instructor / admin

    @Operation(summary = "Agenda de clases (instructor/admin)")
    @GetMapping("/agenda")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public List<ClaseManejoDto> agenda(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
                                       @RequestParam(required = false) Integer instructorId,
                                       @RequestParam(required = false) Integer sucursalId,
                                       @AuthenticationPrincipal UsuarioAutenticado yo) {
        return claseService.agenda(desde, hasta, instructorId, sucursalId, yo);
    }

    @Operation(summary = "Cambiar estado de una clase (instructor/admin)")
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ClaseManejoDto cambiarEstado(@PathVariable Integer id, @Valid @RequestBody CambioEstadoRequest req,
                                        @AuthenticationPrincipal UsuarioAutenticado yo) {
        return claseService.cambiarEstado(id, req.estado(), yo);
    }
}
