package com.km0automotores.exception;

import org.springframework.http.HttpStatus;

/** 403: el usuario está logueado pero no puede operar sobre ese recurso. */
public class AccesoDenegadoException extends ApiException {

    public AccesoDenegadoException(String mensaje) {
        super(HttpStatus.FORBIDDEN, mensaje);
    }
}
