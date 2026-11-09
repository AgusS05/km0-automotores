package com.km0automotores.mapper;

import com.km0automotores.dto.admin.VehiculoDemoDto;
import com.km0automotores.dto.catalogo.ColorDto;
import com.km0automotores.dto.catalogo.ImagenDto;
import com.km0automotores.dto.catalogo.MarcaDto;
import com.km0automotores.dto.catalogo.ModeloDetalleDto;
import com.km0automotores.dto.catalogo.ModeloResumenDto;
import com.km0automotores.dto.catalogo.VersionDto;
import com.km0automotores.dto.sucursal.SucursalDto;
import com.km0automotores.model.ColorModelo;
import com.km0automotores.model.Combustible;
import com.km0automotores.model.ImagenModelo;
import com.km0automotores.model.Marca;
import com.km0automotores.model.Modelo;
import com.km0automotores.model.Sucursal;
import com.km0automotores.model.VehiculoDemo;
import com.km0automotores.model.VersionModelo;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Convierte entidades del catálogo en DTOs. Se llama siempre dentro de un
 * método @Transactional del servicio, para que las relaciones perezosas
 * (versiones, imágenes, colores) se puedan leer.
 */
public final class CatalogoMapper {

    private CatalogoMapper() {
    }

    public static MarcaDto toMarcaDto(Marca marca, long cantidadModelos) {
        return new MarcaDto(marca.getId(), marca.getNombre(), cantidadModelos);
    }

    public static ImagenDto toImagenDto(ImagenModelo img) {
        return new ImagenDto(img.getId(), img.getUrl(), img.getFuenteUrl(), img.getCredito(), img.getOrden());
    }

    public static ColorDto toColorDto(ColorModelo color) {
        return new ColorDto(color.getId(), color.getNombre(), color.getHex());
    }

    public static VersionDto toVersionDto(VersionModelo v) {
        Modelo m = v.getModelo();
        return new VersionDto(v.getId(), m.getId(), m.getNombre(), m.getMarca().getNombre(), m.getTipoCarroceria(),
                v.getNombreVersion(), v.getPrecio(), v.getMotor(), v.getPotenciaCv(), v.getTransmision(),
                v.getCombustible(), v.getTraccion(), v.getPuertas(), v.getPlazas(), imagenPrincipal(m));
    }

    public static ModeloResumenDto toModeloResumen(Modelo m) {
        Set<Combustible> combustibles = EnumSet.noneOf(Combustible.class);
        m.getVersiones().forEach(v -> combustibles.add(v.getCombustible()));
        return new ModeloResumenDto(m.getId(), m.getNombre(), m.getMarca().getId(), m.getMarca().getNombre(),
                m.getTipoCarroceria(), m.getAnio(), precioDesde(m), imagenPrincipal(m), combustibles,
                m.getVersiones().size(), m.isDestacado());
    }

    public static ModeloDetalleDto toModeloDetalle(Modelo m, List<Sucursal> sucursalesConDemo) {
        return new ModeloDetalleDto(m.getId(), m.getNombre(), m.getMarca().getId(), m.getMarca().getNombre(),
                m.getTipoCarroceria(), m.getAnio(), m.getDescripcion(), m.isDestacado(), precioDesde(m),
                m.getVersiones().stream().map(CatalogoMapper::toVersionDto).toList(),
                m.getImagenes().stream().map(CatalogoMapper::toImagenDto).toList(),
                m.getColores().stream().map(CatalogoMapper::toColorDto).toList(),
                sucursalesConDemo.stream()
                        .sorted(Comparator.comparing(Sucursal::getId))
                        .map(CatalogoMapper::toSucursalDto).toList());
    }

    public static SucursalDto toSucursalDto(Sucursal s) {
        return new SucursalDto(s.getId(), s.getNombre(), s.getDireccion(), s.getCiudad(), s.getTelefono(),
                s.getHorarioApertura(), s.getHorarioCierre(), s.getCierreSabado());
    }

    public static VehiculoDemoDto toVehiculoDemoDto(VehiculoDemo v) {
        VersionModelo ve = v.getVersion();
        Modelo m = ve.getModelo();
        return new VehiculoDemoDto(v.getId(), v.getPatente(), v.isDisponible(), ve.getId(), ve.getNombreVersion(),
                m.getId(), m.getNombre(), m.getMarca().getNombre(), v.getSucursal().getId(),
                v.getSucursal().getNombre());
    }

    private static BigDecimal precioDesde(Modelo m) {
        return m.getVersiones().stream()
                .map(VersionModelo::getPrecio)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);
    }

    private static String imagenPrincipal(Modelo m) {
        return m.getImagenes().isEmpty() ? null : m.getImagenes().get(0).getUrl();
    }
}
