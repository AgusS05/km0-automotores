package com.km0automotores.mapper;

import com.km0automotores.dto.compra.SolicitudCompraDto;
import com.km0automotores.model.ColorModelo;
import com.km0automotores.model.FormaPago;
import com.km0automotores.model.ImagenModelo;
import com.km0automotores.model.Modelo;
import com.km0automotores.model.SolicitudCompra;
import com.km0automotores.model.Sucursal;
import com.km0automotores.model.VersionModelo;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class SolicitudMapper {

    private SolicitudMapper() {
    }

    public static SolicitudCompraDto toDto(SolicitudCompra s) {
        VersionModelo v = s.getVersion();
        Modelo m = v.getModelo();
        Sucursal su = s.getSucursal();
        String imagen = m.getImagenes().stream().findFirst().map(ImagenModelo::getUrl).orElse(null);
        String colorHex = s.getColor() == null ? null : m.getColores().stream()
                .filter(c -> c.getNombre().equalsIgnoreCase(s.getColor()))
                .findFirst().map(ColorModelo::getHex).orElse(null);

        boolean financiado = s.getFormaPago() == FormaPago.FINANCIADO && s.getAnticipo() != null;
        BigDecimal montoFinanciado = financiado ? s.getPrecioLista().subtract(s.getAnticipo()) : null;
        BigDecimal totalCuotas = financiado && s.getCuotaEstimada() != null && s.getCuotas() != null
                ? s.getCuotaEstimada().multiply(BigDecimal.valueOf(s.getCuotas())).setScale(2, RoundingMode.HALF_UP)
                : null;

        return new SolicitudCompraDto(s.getId(), s.getEstado(), s.getCreadoEn(), s.getActualizadoEn(),
                TurnoMapper.toPersona(s.getCliente()), TurnoMapper.toPersona(s.getVendedor()),
                m.getId(), m.getMarca().getNombre(), m.getNombre(), m.getTipoCarroceria(),
                v.getId(), v.getNombreVersion(), v.getMotor(), v.getTransmision(), v.getCombustible(),
                imagen, s.getColor(), colorHex,
                su.getId(), su.getNombre(), su.getDireccion(), su.getTelefono(),
                s.getFormaPago(), s.getPrecioLista(), s.getAnticipo(), s.getCuotas(), s.getTnaReferencia(),
                montoFinanciado, s.getCuotaEstimada(), totalCuotas,
                s.isEntregaUsado(), s.getUsadoDescripcion(), s.getComentario());
    }
}
