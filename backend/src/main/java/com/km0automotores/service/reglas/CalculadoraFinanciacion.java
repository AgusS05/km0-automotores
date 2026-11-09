package com.km0automotores.service.reglas;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

/**
 * Simulación de un crédito con sistema francés (cuota fija), como los prendarios de las concesionarias.
 * Clase pura: no depende de Spring ni de la base, así se prueba con tests unitarios simples.
 *
 * <pre>
 *   cuota = monto × i / (1 − (1 + i)^−n)      con  i = TNA / 12 / 100
 * </pre>
 */
public final class CalculadoraFinanciacion {

    private static final MathContext MC = MathContext.DECIMAL64;
    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    private CalculadoraFinanciacion() {
    }

    /**
     * Resultado de la simulación.
     *
     * @param montoFinanciado precio − anticipo
     * @param cuota           cuota mensual fija
     * @param totalCuotas     cuota × cantidad de cuotas (lo que se termina pagando por el crédito)
     */
    public record Simulacion(BigDecimal montoFinanciado, BigDecimal cuota, BigDecimal totalCuotas) {
    }

    /**
     * Calcula la cuota de un crédito.
     *
     * @param precio        precio del auto
     * @param anticipo      lo que se paga al contado
     * @param cuotas        cantidad de cuotas mensuales
     * @param tnaPorcentaje tasa nominal anual en %, ej. 39.0 (0 = sin interés)
     */
    public static Simulacion simular(BigDecimal precio, BigDecimal anticipo, int cuotas, BigDecimal tnaPorcentaje) {
        if (cuotas <= 0) {
            throw new IllegalArgumentException("La cantidad de cuotas tiene que ser positiva");
        }
        BigDecimal monto = precio.subtract(anticipo);
        BigDecimal i = tnaPorcentaje.divide(BigDecimal.valueOf(1200), MC);
        BigDecimal cuota;
        if (i.signum() == 0) {
            cuota = monto.divide(BigDecimal.valueOf(cuotas), 2, RoundingMode.HALF_UP);
        } else {
            BigDecimal factor = BigDecimal.ONE.add(i).pow(cuotas, MC);                 // (1 + i)^n
            cuota = monto.multiply(i).multiply(factor)                                // monto · i · (1+i)^n
                    .divide(factor.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP); //   / ((1+i)^n − 1)
        }
        return new Simulacion(monto.setScale(2, RoundingMode.HALF_UP), cuota,
                cuota.multiply(BigDecimal.valueOf(cuotas)).setScale(2, RoundingMode.HALF_UP));
    }

    /**
     * Valida un pedido de financiación.
     *
     * @return el motivo por el que no es válido, o vacío si está bien
     */
    public static Optional<String> validar(BigDecimal precio, BigDecimal anticipo, Integer cuotas,
                                           List<Integer> cuotasPermitidas, int anticipoMinimoPorcentaje) {
        if (anticipo == null) {
            return Optional.of("Indicá cuánto pagás de anticipo.");
        }
        if (cuotas == null || !cuotasPermitidas.contains(cuotas)) {
            return Optional.of("Elegí una cantidad de cuotas: " + cuotasPermitidas + ".");
        }
        if (anticipo.compareTo(precio) >= 0) {
            return Optional.of("El anticipo cubre todo el precio: elegí pago de contado.");
        }
        BigDecimal minimo = anticipoMinimo(precio, anticipoMinimoPorcentaje);
        if (anticipo.compareTo(minimo) < 0) {
            return Optional.of("El anticipo mínimo es el " + anticipoMinimoPorcentaje + " % del precio ($ "
                    + String.format(java.util.Locale.forLanguageTag("es-AR"), "%,.0f", minimo) + ").");
        }
        return Optional.empty();
    }

    /** Anticipo mínimo en pesos, redondeado hacia arriba al peso. */
    public static BigDecimal anticipoMinimo(BigDecimal precio, int porcentaje) {
        return precio.multiply(BigDecimal.valueOf(porcentaje)).divide(CIEN, 0, RoundingMode.CEILING);
    }
}
