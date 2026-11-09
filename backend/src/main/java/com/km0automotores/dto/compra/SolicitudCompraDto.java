package com.km0automotores.dto.compra;

import com.km0automotores.dto.turno.PersonaDto;
import com.km0automotores.model.Combustible;
import com.km0automotores.model.EstadoSolicitud;
import com.km0automotores.model.FormaPago;
import com.km0automotores.model.TipoCarroceria;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Solicitud de compra con todo lo necesario para armar el presupuesto imprimible.
 *
 * @param colorHex        color para la muestra en pantalla (null si el color ya no está en el catálogo)
 * @param imagenUrl       primera foto del modelo (null si no tiene)
 * @param montoFinanciado precio − anticipo (solo FINANCIADO)
 * @param totalCuotas     cuota × cantidad de cuotas (solo FINANCIADO)
 */
public record SolicitudCompraDto(
        Integer id,
        EstadoSolicitud estado,
        LocalDateTime creadoEn,
        LocalDateTime actualizadoEn,
        PersonaDto cliente,
        PersonaDto vendedor,
        Integer modeloId,
        String marcaNombre,
        String modeloNombre,
        TipoCarroceria tipoCarroceria,
        Integer versionId,
        String versionNombre,
        String motor,
        String transmision,
        Combustible combustible,
        String imagenUrl,
        String color,
        String colorHex,
        Integer sucursalId,
        String sucursalNombre,
        String sucursalDireccion,
        String sucursalTelefono,
        FormaPago formaPago,
        BigDecimal precioLista,
        BigDecimal anticipo,
        Integer cuotas,
        BigDecimal tnaReferencia,
        BigDecimal montoFinanciado,
        BigDecimal cuotaEstimada,
        BigDecimal totalCuotas,
        boolean entregaUsado,
        String usadoDescripcion,
        String comentario
) {
}
