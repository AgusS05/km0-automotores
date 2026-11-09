package com.km0automotores.controller;

import com.km0automotores.dto.admin.ColorRequest;
import com.km0automotores.dto.admin.ImagenRequest;
import com.km0automotores.dto.admin.MarcaRequest;
import com.km0automotores.dto.admin.ModeloRequest;
import com.km0automotores.dto.admin.VersionRequest;
import com.km0automotores.dto.catalogo.ColorDto;
import com.km0automotores.dto.catalogo.ImagenDto;
import com.km0automotores.dto.catalogo.MarcaDto;
import com.km0automotores.dto.catalogo.ModeloDetalleDto;
import com.km0automotores.dto.catalogo.VersionDto;
import com.km0automotores.service.AdminCatalogoService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * ABM del catálogo. Todo /api/admin/** está restringido a ADMIN en SecurityConfig.
 * Para listar se usan los endpoints públicos (/api/marcas, /api/modelos, /api/versiones).
 */
@Tag(name = "Admin · Catálogo", description = "ABM de marcas, modelos, versiones, fotos y colores (solo ADMIN)")
@RestController
@RequestMapping("/api/admin")
public class AdminCatalogoController {

    private final AdminCatalogoService service;

    public AdminCatalogoController(AdminCatalogoService service) {
        this.service = service;
    }

    @Operation(summary = "Crear marca")
    @PostMapping("/marcas")
    @ResponseStatus(HttpStatus.CREATED)
    public MarcaDto crearMarca(@Valid @RequestBody MarcaRequest req) {
        return service.crearMarca(req);
    }

    @Operation(summary = "Editar marca")
    @PutMapping("/marcas/{id}")
    public MarcaDto editarMarca(@PathVariable Integer id, @Valid @RequestBody MarcaRequest req) {
        return service.editarMarca(id, req);
    }

    @Operation(summary = "Eliminar marca", description = "409 si tiene modelos.")
    @DeleteMapping("/marcas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarMarca(@PathVariable Integer id) {
        service.eliminarMarca(id);
    }

    @Operation(summary = "Crear modelo")
    @PostMapping("/modelos")
    @ResponseStatus(HttpStatus.CREATED)
    public ModeloDetalleDto crearModelo(@Valid @RequestBody ModeloRequest req) {
        return service.crearModelo(req);
    }

    @Operation(summary = "Editar modelo")
    @PutMapping("/modelos/{id}")
    public ModeloDetalleDto editarModelo(@PathVariable Integer id, @Valid @RequestBody ModeloRequest req) {
        return service.editarModelo(id, req);
    }

    @Operation(summary = "Eliminar modelo", description = "409 si tiene versiones.")
    @DeleteMapping("/modelos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarModelo(@PathVariable Integer id) {
        service.eliminarModelo(id);
    }

    @Operation(summary = "Crear versión")
    @PostMapping("/versiones")
    @ResponseStatus(HttpStatus.CREATED)
    public VersionDto crearVersion(@Valid @RequestBody VersionRequest req) {
        return service.crearVersion(req);
    }

    @Operation(summary = "Editar versión")
    @PutMapping("/versiones/{id}")
    public VersionDto editarVersion(@PathVariable Integer id, @Valid @RequestBody VersionRequest req) {
        return service.editarVersion(id, req);
    }

    @Operation(summary = "Eliminar versión", description = "409 si tiene unidades demo.")
    @DeleteMapping("/versiones/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarVersion(@PathVariable Integer id) {
        service.eliminarVersion(id);
    }

    @Operation(summary = "Agregar foto a un modelo")
    @PostMapping("/modelos/{modeloId}/imagenes")
    @ResponseStatus(HttpStatus.CREATED)
    public ImagenDto agregarImagen(@PathVariable Integer modeloId, @Valid @RequestBody ImagenRequest req) {
        return service.agregarImagen(modeloId, req);
    }

    @Operation(summary = "Eliminar foto")
    @DeleteMapping("/imagenes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarImagen(@PathVariable Integer id) {
        service.eliminarImagen(id);
    }

    @Operation(summary = "Agregar color a un modelo")
    @PostMapping("/modelos/{modeloId}/colores")
    @ResponseStatus(HttpStatus.CREATED)
    public ColorDto agregarColor(@PathVariable Integer modeloId, @Valid @RequestBody ColorRequest req) {
        return service.agregarColor(modeloId, req);
    }

    @Operation(summary = "Eliminar color")
    @DeleteMapping("/colores/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarColor(@PathVariable Integer id) {
        service.eliminarColor(id);
    }
}
