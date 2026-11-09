package com.km0automotores.exception;

import com.km0automotores.dto.comun.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Traduce las excepciones a respuestas JSON con el formato de ErrorResponse.
 * Así los controladores no tienen try/catch y el frontend siempre recibe lo mismo.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> manejarApi(ApiException ex, HttpServletRequest req) {
        return responder(ex.getStatus(), ex.getMessage(), Map.of(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> manejarValidacion(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return responder(HttpStatus.BAD_REQUEST, "Revisá los datos ingresados.", campos, req);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorResponse> manejarFormato(Exception ex, HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST, "La solicitud tiene un formato inválido.", Map.of(), req);
    }

    /**
     * Violación de una restricción de la base. El caso más importante: dos personas
     * reservan el mismo horario al mismo tiempo. El servicio ya verifica la
     * disponibilidad, pero si ambas pasan el chequeo a la vez, el índice único
     * parcial de Postgres rechaza la segunda y acá se informa como conflicto.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> manejarIntegridad(DataIntegrityViolationException ex, HttpServletRequest req) {
        String detalle = ex.getMostSpecificCause().getMessage();
        String mensaje;
        if (detalle != null && detalle.contains("_horario")) {
            mensaje = "Ese horario se acaba de ocupar. Elegí otro, por favor.";
        } else if (detalle != null && detalle.contains("uq_solicitud_abierta")) {
            mensaje = "Ya tenés una solicitud abierta para esta versión.";
        } else if (detalle != null && detalle.contains("foreign key")) {
            mensaje = "No se puede eliminar porque tiene datos relacionados.";
        } else {
            mensaje = "La operación no se puede realizar porque hay datos repetidos o inconsistentes.";
        }
        log.warn("Violación de integridad en {}: {}", req.getRequestURI(), detalle);
        return responder(HttpStatus.CONFLICT, mensaje, Map.of(), req);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> manejarAccesoDenegado(AccessDeniedException ex, HttpServletRequest req) {
        return responder(HttpStatus.FORBIDDEN, "No tenés permisos para esta acción.", Map.of(), req);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> manejarRutaInexistente(NoResourceFoundException ex, HttpServletRequest req) {
        return responder(HttpStatus.NOT_FOUND, "La ruta no existe.", Map.of(), req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarInesperado(Exception ex, HttpServletRequest req) {
        log.error("Error inesperado en {}", req.getRequestURI(), ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocurrió un error inesperado. Probá de nuevo en unos minutos.", Map.of(), req);
    }

    private ResponseEntity<ErrorResponse> responder(HttpStatus status, String mensaje,
                                                    Map<String, String> campos, HttpServletRequest req) {
        ErrorResponse body = new ErrorResponse(status.value(), status.getReasonPhrase(), mensaje,
                campos, req.getRequestURI(), LocalDateTime.now());
        return ResponseEntity.status(status).body(body);
    }
}
