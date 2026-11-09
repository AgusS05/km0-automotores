package com.km0automotores.model;

/** Cómo piensa pagar el cliente el auto que le interesa. */
public enum FormaPago {
    CONTADO,
    /** Crédito prendario: anticipo + cuotas fijas (sistema francés). */
    FINANCIADO,
    /** Plan de ahorro de la marca: lo gestiona el vendedor, sin simulación. */
    PLAN_AHORRO
}
