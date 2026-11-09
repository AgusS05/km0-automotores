package com.km0automotores.service;

import com.km0automotores.dto.catalogo.FiltroCatalogo;
import com.km0automotores.dto.catalogo.MarcaDto;
import com.km0automotores.dto.catalogo.ModeloDetalleDto;
import com.km0automotores.dto.catalogo.ModeloResumenDto;
import com.km0automotores.dto.catalogo.VersionDto;
import com.km0automotores.exception.RecursoNoEncontradoException;
import com.km0automotores.mapper.CatalogoMapper;
import com.km0automotores.model.Modelo;
import com.km0automotores.repository.MarcaRepository;
import com.km0automotores.repository.ModeloRepository;
import com.km0automotores.repository.VehiculoDemoRepository;
import com.km0automotores.repository.VersionModeloRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Consultas públicas del catálogo.
 * Los filtros se aplican en memoria: el catálogo de una concesionaria tiene
 * decenas de modelos, así que traerlos en 3 consultas (modelos+marca, versiones
 * e imágenes en lote) y filtrar en Java es simple y rápido. Si creciera a miles,
 * se pasaría el filtrado a la base con Specifications de Spring Data.
 */
@Service
@Transactional(readOnly = true)
public class CatalogoService {

    private final MarcaRepository marcaRepository;
    private final ModeloRepository modeloRepository;
    private final VersionModeloRepository versionRepository;
    private final VehiculoDemoRepository vehiculoDemoRepository;

    public CatalogoService(MarcaRepository marcaRepository, ModeloRepository modeloRepository,
                           VersionModeloRepository versionRepository, VehiculoDemoRepository vehiculoDemoRepository) {
        this.marcaRepository = marcaRepository;
        this.modeloRepository = modeloRepository;
        this.versionRepository = versionRepository;
        this.vehiculoDemoRepository = vehiculoDemoRepository;
    }

    /**
     * Marcas ordenadas por nombre, con la cantidad de modelos de cada una.
     */
    public List<MarcaDto> listarMarcas() {
        Map<Integer, Long> modelosPorMarca = modeloRepository.findAllConMarca().stream()
                .collect(Collectors.groupingBy(m -> m.getMarca().getId(), Collectors.counting()));
        return marcaRepository.findAllByOrderByNombreAsc().stream()
                .map(marca -> CatalogoMapper.toMarcaDto(marca, modelosPorMarca.getOrDefault(marca.getId(), 0L)))
                .toList();
    }

    /**
     * Modelos del catálogo filtrados en memoria (el catálogo es chico: decenas de modelos).
     *
     * <p>La búsqueda por texto ignora mayúsculas y tildes.</p>
     *
     * @param filtro marca, carrocería, combustible, precio máximo, texto y destacados; todos opcionales
     * @return modelos que cumplen todos los filtros indicados
     */
    public List<ModeloResumenDto> listarModelos(FiltroCatalogo filtro) {
        String busqueda = normalizar(filtro.q());
        return modeloRepository.findAllConMarca().stream()
                .filter(m -> filtro.marcaId() == null || m.getMarca().getId().equals(filtro.marcaId()))
                .filter(m -> filtro.carroceria() == null || m.getTipoCarroceria() == filtro.carroceria())
                .filter(m -> !Boolean.TRUE.equals(filtro.destacados()) || m.isDestacado())
                .filter(m -> busqueda.isEmpty()
                        || normalizar(m.getMarca().getNombre() + " " + m.getNombre()).contains(busqueda))
                .map(CatalogoMapper::toModeloResumen)
                .filter(r -> filtro.combustible() == null || r.combustibles().contains(filtro.combustible()))
                .filter(r -> filtro.precioMax() == null
                        || (r.precioDesde() != null && r.precioDesde().compareTo(filtro.precioMax()) <= 0))
                .toList();
    }

    /**
     * Ficha completa de un modelo: versiones, fotos, colores y sucursales con unidad demo.
     * @throws RecursoNoEncontradoException si el modelo no existe
     */
    public ModeloDetalleDto obtenerModelo(Integer id) {
        Modelo modelo = modeloRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("El modelo", id));
        return CatalogoMapper.toModeloDetalle(modelo, vehiculoDemoRepository.findSucursalesConDemo(id));
    }

    /** Todas las versiones, o solo las pedidas (para el comparador), respetando el orden pedido. */
    public List<VersionDto> listarVersiones(Collection<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return versionRepository.findAllConModelo().stream().map(CatalogoMapper::toVersionDto).toList();
        }
        Map<Integer, VersionDto> porId = versionRepository.findConModeloByIdIn(ids).stream()
                .map(CatalogoMapper::toVersionDto)
                .collect(Collectors.toMap(VersionDto::id, Function.identity()));
        return ids.stream().distinct().map(porId::get).filter(v -> v != null).toList();
    }

    /** Minúsculas y sin tildes: "Córdoba" y "cordoba" coinciden. */
    static String normalizar(String texto) {
        if (texto == null) {
            return "";
        }
        return Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim();
    }
}
