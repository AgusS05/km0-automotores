package com.km0automotores.service.reglas;

import com.km0automotores.model.EstadoSolicitud;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalculadoraFinanciacionTest {

    private static final List<Integer> CUOTAS = List.of(12, 24, 36, 48, 60);
    private static final BigDecimal PRECIO = new BigDecimal("10000000");

    @Test
    @DisplayName("Sistema francés: 1.000.000 al 12 % anual en 12 cuotas da 88.848,79 por mes")
    void cuotaConocida() {
        CalculadoraFinanciacion.Simulacion sim = CalculadoraFinanciacion.simular(
                new BigDecimal("1500000"), new BigDecimal("500000"), 12, new BigDecimal("12"));
        assertEquals(new BigDecimal("1000000.00"), sim.montoFinanciado());
        assertEquals(new BigDecimal("88848.79"), sim.cuota());
        assertEquals(new BigDecimal("1066185.48"), sim.totalCuotas());
    }

    @Test
    @DisplayName("Con tasa 0 la cuota es el monto dividido la cantidad de cuotas")
    void sinInteres() {
        CalculadoraFinanciacion.Simulacion sim = CalculadoraFinanciacion.simular(
                PRECIO, new BigDecimal("4000000"), 24, BigDecimal.ZERO);
        assertEquals(new BigDecimal("250000.00"), sim.cuota());
    }

    @Test
    @DisplayName("Un pedido de financiación válido no devuelve motivo de rechazo")
    void financiacionValida() {
        assertEquals(Optional.empty(),
                CalculadoraFinanciacion.validar(PRECIO, new BigDecimal("3000000"), 36, CUOTAS, 30));
    }

    @Test
    @DisplayName("Se rechaza anticipo menor al mínimo, anticipo que cubre todo, plazo no ofrecido y datos faltantes")
    void rechazos() {
        assertTrue(CalculadoraFinanciacion.validar(PRECIO, new BigDecimal("2999999"), 36, CUOTAS, 30).isPresent());
        assertTrue(CalculadoraFinanciacion.validar(PRECIO, PRECIO, 36, CUOTAS, 30).isPresent());
        assertTrue(CalculadoraFinanciacion.validar(PRECIO, new BigDecimal("5000000"), 18, CUOTAS, 30).isPresent());
        assertTrue(CalculadoraFinanciacion.validar(PRECIO, null, 36, CUOTAS, 30).isPresent());
        assertTrue(CalculadoraFinanciacion.validar(PRECIO, new BigDecimal("5000000"), null, CUOTAS, 30).isPresent());
    }

    @Test
    @DisplayName("El anticipo mínimo se redondea hacia arriba al peso")
    void anticipoMinimo() {
        assertEquals(new BigDecimal("3000000"), CalculadoraFinanciacion.anticipoMinimo(PRECIO, 30));
        assertEquals(new BigDecimal("10"), CalculadoraFinanciacion.anticipoMinimo(new BigDecimal("33"), 30));
    }

    @Test
    @DisplayName("Embudo de venta: transiciones válidas, estados finales y estados abiertos")
    void estadosDeLaSolicitud() {
        assertTrue(EstadoSolicitud.NUEVA.puedePasarA(EstadoSolicitud.CONTACTADA));
        assertTrue(EstadoSolicitud.CONTACTADA.puedePasarA(EstadoSolicitud.VENDIDA));
        assertTrue(EstadoSolicitud.RESERVADA.puedePasarA(EstadoSolicitud.DESCARTADA));
        assertFalse(EstadoSolicitud.NUEVA.puedePasarA(EstadoSolicitud.VENDIDA));
        assertFalse(EstadoSolicitud.VENDIDA.puedePasarA(EstadoSolicitud.DESCARTADA));
        assertFalse(EstadoSolicitud.DESCARTADA.esAbierta());
        assertTrue(EstadoSolicitud.RESERVADA.esAbierta());
        assertEquals(3, EstadoSolicitud.abiertos().size());
    }
}
