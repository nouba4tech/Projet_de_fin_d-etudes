package com.mirador.hotel.exception;

/** Raised when a call to another microservice fails (unreachable, timeout, 5xx). */
public class RemoteServiceException extends RuntimeException {

    public RemoteServiceException(String message) {
        super(message);
    }

    public RemoteServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
