package com.km0automotores.exception;

import org.springframework.http.HttpStatus;

/** 422: los datos tienen buen formato pero violan una regla del negocio. */
public class ReglaNegocioException extends ApiException {

    public ReglaNegocioException(String mensaje) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, mensaje);
    }
}
