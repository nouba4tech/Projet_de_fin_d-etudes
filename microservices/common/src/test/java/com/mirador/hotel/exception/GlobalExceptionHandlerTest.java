package com.mirador.hotel.exception;

import java.util.Objects;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void validationErrorsAreBadRequestWithTheirMessage() {
        var response = handler.handleIllegalArgument(new IllegalArgumentException("Les dates de reservation sont obligatoires."));
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Les dates de reservation sont obligatoires.", Objects.requireNonNull(response.getBody()).message());
    }

    @Test
    void businessConflictsAre409() {
        var response = handler.handleConflict(new ConflictException("La chambre 101 n'est pas disponible sur cette periode."));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("La chambre 101 n'est pas disponible sur cette periode.", Objects.requireNonNull(response.getBody()).message());
    }

    @Test
    void unavailableRemoteServiceIs503() {
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, handler.handleRemote(new RemoteServiceException("down")).getStatusCode());
    }

    @Test
    void unexpectedErrorsStay500() {
        var response = handler.handleGlobalException(new IllegalStateException("Impossible de recuperer l'identifiant client."));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}
