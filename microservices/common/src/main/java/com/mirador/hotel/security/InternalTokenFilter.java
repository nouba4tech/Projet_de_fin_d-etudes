package com.mirador.hotel.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Protects the service-to-service endpoints ({@code /internal/**}). They are never routed by the
 * API gateway and additionally require the shared {@value #HEADER} header.
 */
@Component
public class InternalTokenFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Internal-Token";

    private final byte[] expected;

    public InternalTokenFilter(@Value("${internal.token}") String token) {
        this.expected = token.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/internal/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String provided = request.getHeader(HEADER);
        boolean ok = provided != null
                && MessageDigest.isEqual(expected, provided.getBytes(StandardCharsets.UTF_8));
        if (!ok) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Acces interne refuse");
            return;
        }
        chain.doFilter(request, response);
    }
}
