package com.km0automotores.exception;

import org.springframework.http.HttpStatus;

/**
 * Error de negocio con su código HTTP. El GlobalExceptionHandler lo convierte
 * en una respuesta JSON prolija para el frontend.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
