package com.mirador.hotel.exception;

import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;
import java.util.Collections;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Global exception handler for the Mirador Hotel Backend application.
 * This class centralizes the handling of exceptions across all controllers,
 * providing consistent error responses to the client.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles MethodArgumentNotValidException, which is thrown when
     * validation on an argument annotated with @Valid or @Validated fails.
     * It collects all field errors and returns them in a structured map.
     *
     * @param ex The MethodArgumentNotValidException that occurred.
     * @return A ResponseEntity containing a map of field errors and an HTTP status of BAD_REQUEST.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return buildErrorResponse("Erreur de validation", HttpStatus.BAD_REQUEST, errors);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND, null);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT, null);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(InvalidCredentialsException ex) {
        return buildErrorResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGlobalException(Exception ex) {
        return buildErrorResponse("Une erreur inattendue est survenue : " + ex.getMessage(), 
                                   HttpStatus.INTERNAL_SERVER_ERROR, null);
    }

    private ResponseEntity<ApiError> buildErrorResponse(String message, HttpStatus status, Map<String, String> errors) {
        ApiError error = new ApiError(
            LocalDateTime.now(),
            status.value(),
            message,
            errors != null ? errors : Collections.emptyMap()
        );
        return new ResponseEntity<>(error, status);
    }
}