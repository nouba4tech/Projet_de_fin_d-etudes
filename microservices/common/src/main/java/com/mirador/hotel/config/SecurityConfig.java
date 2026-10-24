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

/**
 * Shared by every microservice. The JWT carries the user's role ("Admin", "Comptable", "Reception", "Service").
 * <ul>
 *   <li>Reading (GET) is open to any signed-in user, except the security module (Admin only).</li>
 *   <li>Writing (POST/PUT/PATCH/DELETE) is restricted per business area, mirroring the screens each role has.
 *       The Reception screen also posts accounting operations and stock movements, so those two are allowed.</li>
 * </ul>
 * Rules of other services' paths are harmless here: each service only receives its own routes.
 */
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
                    auth.requestMatchers("/api/auth/**", "/internal/**", "/actuator/health", "/v3/api-docs/**",
                            "/swagger-ui/**", "/swagger-ui.html").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/avis/public/**").permitAll();

                    // Users, groups, privileges, backups: administrators only (every user may change their own password)
                    auth.requestMatchers(HttpMethod.POST, "/api/security/change-password").authenticated();
                    auth.requestMatchers("/api/security/**", "/api/demo/**").hasAuthority(ADMIN);

                    // Writes allowed to the Reception because its screen performs them
                    writes(auth, new String[] {"/api/accounting/sqlite/operations", "/api/accounting/operations/**"},
                            ADMIN, COMPTABLE, RECEPTION);
                    writes(auth, new String[] {"/api/stock/movements"}, ADMIN, RECEPTION);

                    // Finance and accounting
                    writes(auth, new String[] {"/api/accounting/**", "/api/comptabilite/**", "/api/finances/**", "/api/cash/**"},
                            ADMIN, COMPTABLE);
                    writes(auth, new String[] {"/api/factures/**", "/api/paiements/**"}, ADMIN, COMPTABLE, RECEPTION);

                    // Front office
                    writes(auth, new String[] {"/api/reservations/**", "/api/clients/**", "/api/chambres/**", "/api/visits/**",
                            "/api/services/**", "/api/promotions/**", "/api/avis/**", "/api/notifications/**"}, ADMIN, RECEPTION);
                    writes(auth, new String[] {"/api/main-courante/**"}, ADMIN, RECEPTION, COMPTABLE);

                    // Back office and settings: administrators only
                    writes(auth, new String[] {"/api/parametres/**", "/api/employees/**", "/api/planning/**", "/api/stock/**",
                            "/api/fournisseurs/**", "/api/restaurant/**", "/api/bar/**"}, ADMIN);

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
