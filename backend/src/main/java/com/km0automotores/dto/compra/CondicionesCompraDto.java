package com.km0automotores.dto.compra;

import java.math.BigDecimal;
import java.util.List;

/** Condiciones de referencia para que el frontend simule la cuota mientras el cliente completa el formulario. */
public record CondicionesCompraDto(BigDecimal tnaReferencia, List<Integer> cuotas, int anticipoMinimoPorcentaje) {
}
