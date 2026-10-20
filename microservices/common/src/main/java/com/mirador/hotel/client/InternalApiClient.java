package com.mirador.hotel.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.ConflictException;
import com.mirador.hotel.exception.RemoteServiceException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.security.InternalTokenFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.function.Supplier;

/**
 * Thin HTTP client for synchronous service-to-service calls on {@code /internal/**} endpoints.
 * HTTP errors returned by the remote service are translated back into the matching local exception
 * (404 -> ResourceNotFound, 400 -> BadRequest, 409 -> Conflict, anything else -> RemoteService).
 */
@Component
public class InternalApiClient {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient restClient;

    public InternalApiClient(@Value("${internal.token}") String token) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(15000);
        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader(InternalTokenFilter.HEADER, token)
                .build();
    }

    public <T> T get(String baseUrl, String path, Class<T> type) {
        return call(() -> restClient.get().uri(baseUrl + path).retrieve().body(type));
    }

    public <T> T get(String baseUrl, String path, ParameterizedTypeReference<T> type) {
        return call(() -> restClient.get().uri(baseUrl + path).retrieve().body(type));
    }

    public <T> T post(String baseUrl, String path, Object body, Class<T> type) {
        return call(() -> restClient.post().uri(baseUrl + path).body(body).retrieve().body(type));
    }

    public <T> T post(String baseUrl, String path, Object body, ParameterizedTypeReference<T> type) {
        return call(() -> restClient.post().uri(baseUrl + path).body(body).retrieve().body(type));
    }

    public void put(String baseUrl, String path, Object body) {
        call(() -> restClient.put().uri(baseUrl + path).body(body).retrieve().toBodilessEntity());
    }

    public void delete(String baseUrl, String path) {
        call(() -> restClient.delete().uri(baseUrl + path).retrieve().toBodilessEntity());
    }

    private <T> T call(Supplier<T> action) {
        try {
            return action.get();
        } catch (RestClientResponseException ex) {
            throw translate(ex);
        } catch (RestClientException ex) {
            throw new RemoteServiceException("Service distant indisponible : " + ex.getMessage(), ex);
        }
    }

    private RuntimeException translate(RestClientResponseException ex) {
        String message = extractMessage(ex);
        return switch (ex.getStatusCode().value()) {
            case 400 -> new BadRequestException(message);
            case 404 -> new ResourceNotFoundException(message);
            case 409 -> new ConflictException(message);
            default -> new RemoteServiceException(
                    "Erreur du service distant (" + ex.getStatusCode().value() + ") : " + message, ex);
        };
    }

    private String extractMessage(RestClientResponseException ex) {
        try {
            JsonNode node = JSON.readTree(ex.getResponseBodyAsString());
            String message = node.path("message").asText("");
            if (!message.isBlank()) {
                return message;
            }
        } catch (Exception ignored) {
            // fall through to the raw text
        }
        String raw = ex.getResponseBodyAsString();
        return raw == null || raw.isBlank() ? ex.getStatusText() : raw;
    }
}
