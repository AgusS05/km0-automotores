package com.km0automotores.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * Condiciones de referencia para simular un crédito (sección "app.compras" de application.yml).
 * Son valores orientativos para el presupuesto: el vendedor confirma las condiciones reales.
 *
 * @param tnaReferencia            tasa nominal anual en %, ej. 39.0
 * @param cuotas                   plazos que se ofrecen, ej. [12, 24, 36, 48, 60]
 * @param anticipoMinimoPorcentaje anticipo mínimo como % del precio, ej. 30
 */
@ConfigurationProperties(prefix = "app.compras")
public record ComprasProperties(BigDecimal tnaReferencia, List<Integer> cuotas, int anticipoMinimoPorcentaje) {
}
