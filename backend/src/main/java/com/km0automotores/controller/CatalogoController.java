package com.km0automotores.controller;

import com.km0automotores.dto.catalogo.FiltroCatalogo;
import com.km0automotores.dto.catalogo.MarcaDto;
import com.km0automotores.dto.catalogo.ModeloDetalleDto;
import com.km0automotores.dto.catalogo.ModeloResumenDto;
import com.km0automotores.dto.catalogo.VersionDto;
import com.km0automotores.model.Combustible;
import com.km0automotores.model.TipoCarroceria;
import com.km0automotores.service.CatalogoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/** Catálogo público: no requiere login. */
@Tag(name = "Catálogo", description = "Consulta pública de marcas, modelos y versiones")
@RestController
@RequestMapping("/api")
public class CatalogoController {

    private final CatalogoService catalogoService;

    public CatalogoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @Operation(summary = "Listar marcas")
    @GetMapping("/marcas")
    public List<MarcaDto> marcas() {
        return catalogoService.listarMarcas();
    }

    /** Ej: {@code /api/modelos?marcaId=1&carroceria=SUV&combustible=HIBRIDO&precioMax=50000000&q=corolla} */
    @Operation(summary = "Listar modelos con filtros", description = "Todos los filtros son opcionales y se combinan. La búsqueda por texto ignora tildes.")
    @GetMapping("/modelos")
    public List<ModeloResumenDto> modelos(@RequestParam(required = false) Integer marcaId,
                                          @RequestParam(required = false) TipoCarroceria carroceria,
                                          @RequestParam(required = false) Combustible combustible,
                                          @RequestParam(required = false) BigDecimal precioMax,
                                          @RequestParam(required = false) String q,
                                          @RequestParam(required = false) Boolean destacados) {
        return catalogoService.listarModelos(
                new FiltroCatalogo(marcaId, carroceria, combustible, precioMax, q, destacados));
    }

    @Operation(summary = "Ficha de un modelo", description = "Versiones, fotos, colores y sucursales con unidad demo.")
    @GetMapping("/modelos/{id}")
    public ModeloDetalleDto modelo(@PathVariable Integer id) {
        return catalogoService.obtenerModelo(id);
    }

    /** Sin parámetros devuelve todas; con ?ids=3,7,12 devuelve esas (comparador). */
    @Operation(summary = "Listar versiones", description = "Con ?ids=1,2,3 devuelve solo esas (en ese orden), para el comparador.")
    @GetMapping("/versiones")
    public List<VersionDto> versiones(@RequestParam(required = false) List<Integer> ids) {
        return catalogoService.listarVersiones(ids);
    }
}
