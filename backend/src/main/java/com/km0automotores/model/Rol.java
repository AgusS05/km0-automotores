package com.km0automotores.model;

/** Roles del sistema. CLIENTE es quien reserva; el resto son empleados. */
public enum Rol {
    CLIENTE,
    VENDEDOR,
    INSTRUCTOR,
    ADMIN;

    public boolean esEmpleado() {
        return this != CLIENTE;
    }
}
