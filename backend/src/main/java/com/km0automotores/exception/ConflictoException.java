package com.km0automotores.exception;

import org.springframework.http.HttpStatus;

/** 409: la operación choca con el estado actual (horario ocupado, email repetido, etc.). */
public class ConflictoException extends ApiException {

    public ConflictoException(String mensaje) {
        super(HttpStatus.CONFLICT, mensaje);
    }
}
