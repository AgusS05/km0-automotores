package com.km0automotores.controller;

import com.km0automotores.dto.admin.EmpleadoRequest;
import com.km0automotores.dto.admin.SucursalRequest;
import com.km0automotores.dto.admin.VehiculoDemoDto;
import com.km0automotores.dto.admin.VehiculoDemoRequest;
import com.km0automotores.dto.auth.UsuarioDto;
import com.km0automotores.dto.metricas.MetricasDto;
import com.km0automotores.dto.sucursal.SucursalDto;
import com.km0automotores.security.UsuarioAutenticado;
import com.km0automotores.service.MetricasService;
import com.km0automotores.service.SucursalService;
import com.km0automotores.service.UsuarioService;
import com.km0automotores.service.VehiculoDemoService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Sucursales, unidades demo, empleados y métricas (solo ADMIN). */
@Tag(name = "Admin · Operación", description = "Métricas, sucursales, unidades demo y usuarios (solo ADMIN)")
@RestController
@RequestMapping("/api/admin")
public class AdminOperacionController {

    private final SucursalService sucursalService;
    private final VehiculoDemoService vehiculoDemoService;
    private final UsuarioService usuarioService;
    private final MetricasService metricasService;

    public AdminOperacionController(SucursalService sucursalService, VehiculoDemoService vehiculoDemoService,
                                    UsuarioService usuarioService, MetricasService metricasService) {
        this.sucursalService = sucursalService;
        this.vehiculoDemoService = vehiculoDemoService;
        this.usuarioService = usuarioService;
        this.metricasService = metricasService;
    }

    // -------------------------------------------------------- métricas

    @Operation(summary = "Métricas del período", description = "Sin fechas, toma los últimos 30 días.")
    @GetMapping("/metricas")
    public MetricasDto metricas(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return metricasService.calcular(desde, hasta);
    }

    // -------------------------------------------------------- sucursales

    @Operation(summary = "Crear sucursal")
    @PostMapping("/sucursales")
    @ResponseStatus(HttpStatus.CREATED)
    public SucursalDto crearSucursal(@Valid @RequestBody SucursalRequest req) {
        return sucursalService.crear(req);
    }

    @Operation(summary = "Editar sucursal")
    @PutMapping("/sucursales/{id}")
    public SucursalDto editarSucursal(@PathVariable Integer id, @Valid @RequestBody SucursalRequest req) {
        return sucursalService.editar(id, req);
    }

    @Operation(summary = "Eliminar sucursal", description = "409 si tiene empleados, unidades o turnos.")
    @DeleteMapping("/sucursales/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarSucursal(@PathVariable Integer id) {
        sucursalService.eliminar(id);
    }

    // -------------------------------------------------------- unidades demo

    @Operation(summary = "Listar unidades demo")
    @GetMapping("/vehiculos-demo")
    public List<VehiculoDemoDto> vehiculos() {
        return vehiculoDemoService.listar();
    }

    @Operation(summary = "Crear unidad demo")
    @PostMapping("/vehiculos-demo")
    @ResponseStatus(HttpStatus.CREATED)
    public VehiculoDemoDto crearVehiculo(@Valid @RequestBody VehiculoDemoRequest req) {
        return vehiculoDemoService.crear(req);
    }

    @Operation(summary = "Editar unidad demo")
    @PutMapping("/vehiculos-demo/{id}")
    public VehiculoDemoDto editarVehiculo(@PathVariable Integer id, @Valid @RequestBody VehiculoDemoRequest req) {
        return vehiculoDemoService.editar(id, req);
    }

    @Operation(summary = "Eliminar unidad demo", description = "409 si ya tuvo turnos: en ese caso marcarla como no disponible.")
    @DeleteMapping("/vehiculos-demo/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarVehiculo(@PathVariable Integer id) {
        vehiculoDemoService.eliminar(id);
    }

    // -------------------------------------------------------- usuarios

    /** ?tipo=empleados (por defecto) o ?tipo=clientes */
    @Operation(summary = "Listar usuarios", description = "tipo=empleados (por defecto) o tipo=clientes.")
    @GetMapping("/usuarios")
    public List<UsuarioDto> usuarios(@RequestParam(defaultValue = "empleados") String tipo) {
        return usuarioService.listar(!"clientes".equalsIgnoreCase(tipo));
    }

    @Operation(summary = "Crear empleado")
    @PostMapping("/usuarios")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioDto crearEmpleado(@Valid @RequestBody EmpleadoRequest req) {
        return usuarioService.crearEmpleado(req);
    }

    @Operation(summary = "Editar empleado")
    @PutMapping("/usuarios/{id}")
    public UsuarioDto editarEmpleado(@PathVariable Integer id, @Valid @RequestBody EmpleadoRequest req) {
        return usuarioService.editarEmpleado(id, req);
    }

    /** Body: {"activo": false} */
    @Operation(summary = "Activar o desactivar usuario", description = "Body: {\"activo\": false}. No borra el historial.")
    @PatchMapping("/usuarios/{id}/activo")
    public UsuarioDto cambiarActivo(@PathVariable Integer id, @RequestBody Map<String, Boolean> body,
                                    @AuthenticationPrincipal UsuarioAutenticado yo) {
        return usuarioService.cambiarActivo(id, Boolean.TRUE.equals(body.get("activo")), yo.getId());
    }
}
