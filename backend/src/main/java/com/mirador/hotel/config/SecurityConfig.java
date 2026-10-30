package com.mirador.hotel.config;

import com.mirador.hotel.security.JwtAuthenticationFilter;
import com.mirador.hotel.security.JwtUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import static com.mirador.hotel.util.RoleAccess.ADMIN;
import static com.mirador.hotel.util.RoleAccess.COMPTABLE;
import static com.mirador.hotel.util.RoleAccess.RECEPTION;

@Configuration
public class SecurityConfig {

    private static final HttpMethod[] WRITES = {HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE};

    private final JwtUtils jwtUtils;

    public SecurityConfig(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtUtils);

        http.csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers("/api/auth/**", "/api/demo/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/avis/public/**").permitAll();
                    // modules taken from the microservices: same write rules as their SecurityConfig
                    writes(auth, new String[] {"/api/factures/**", "/api/paiements/**"}, ADMIN, COMPTABLE, RECEPTION);
                    writes(auth, new String[] {"/api/promotions/**", "/api/avis/**", "/api/notifications/**"}, ADMIN, RECEPTION);
                    writes(auth, new String[] {"/api/planning/**"}, ADMIN);
                    auth.anyRequest().authenticated();
                })
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void writes(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth,
                               String[] patterns, String... roles) {
        for (HttpMethod method : WRITES) {
            auth.requestMatchers(method, patterns).hasAnyAuthority(roles);
        }
    }
}
