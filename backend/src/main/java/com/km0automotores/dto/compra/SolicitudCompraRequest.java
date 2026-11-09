package com.km0automotores.dto.compra;

import com.km0automotores.model.FormaPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Pedido de compra del cliente. Anticipo y cuotas solo se usan si la forma de pago es FINANCIADO.
 */
public record SolicitudCompraRequest(
        @NotNull(message = "Elegí una versión") Integer versionId,
        @Size(max = 60) String color,
        @NotNull(message = "Elegí una sucursal") Integer sucursalId,
        @NotNull(message = "Elegí cómo pensás pagar") FormaPago formaPago,
        @PositiveOrZero(message = "El anticipo no puede ser negativo") BigDecimal anticipo,
        Integer cuotas,
        boolean entregaUsado,
        @Size(max = 200, message = "Usá hasta 200 caracteres") String usadoDescripcion,
        @Size(max = 500, message = "Usá hasta 500 caracteres") String comentario
) {
}
