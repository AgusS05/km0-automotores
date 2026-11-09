package com.km0automotores.exception;

import org.springframework.http.HttpStatus;

/** 404: el recurso pedido no existe. */
public class RecursoNoEncontradoException extends ApiException {

    public RecursoNoEncontradoException(String recurso, Object id) {
        super(HttpStatus.NOT_FOUND, recurso + " " + id + " no existe.");
    }
}
