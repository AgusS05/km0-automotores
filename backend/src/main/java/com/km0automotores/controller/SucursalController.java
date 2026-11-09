package com.km0automotores.controller;

import com.km0automotores.dto.sucursal.SucursalDto;
import com.km0automotores.service.SucursalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Sucursales", description = "Consulta pública de sucursales y horarios")
@RestController
@RequestMapping("/api/sucursales")
public class SucursalController {

    private final SucursalService sucursalService;

    public SucursalController(SucursalService sucursalService) {
        this.sucursalService = sucursalService;
    }

    @Operation(summary = "Listar sucursales")
    @GetMapping
    public List<SucursalDto> listar() {
        return sucursalService.listar();
    }
}
