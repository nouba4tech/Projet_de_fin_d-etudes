package com.mirador.hotel.repository;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** Read models exposed to the other microservices through /internal/clients. */
@Repository
public class InternalClientRepository {

    private static final String SELECT = "SELECT c.code_client, c.nom_client, c.type_client, c.contact, "
            + "p.email, p.company_name FROM client c LEFT JOIN app_client_profile p ON p.code_client = c.code_client";

    private static final RowMapper<RemoteApi.ClientInfo> MAPPER = (rs, i) -> new RemoteApi.ClientInfo(
            rs.getLong("code_client"),
            ValueUtils.coalesce(rs.getString("nom_client"), "Client"),
            ValueUtils.coalesce(rs.getString("type_client"), "Personne physique"),
            ValueUtils.trimToNull(rs.getString("company_name")),
            ValueUtils.trimToNull(rs.getString("email")),
            ValueUtils.trimToNull(rs.getString("contact")));

    private final JdbcTemplate jdbcTemplate;

    public InternalClientRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<RemoteApi.ClientInfo> findById(long id) {
        return jdbcTemplate.query(SELECT + " WHERE c.code_client = ?", MAPPER, id).stream().findFirst();
    }

    public Map<String, RemoteApi.ClientInfo> lookup(Collection<Long> ids) {
        Map<String, RemoteApi.ClientInfo> result = new LinkedHashMap<>();
        if (ids.isEmpty()) {
            return result;
        }
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        jdbcTemplate.query(SELECT + " WHERE c.code_client IN (" + placeholders + ")", MAPPER, ids.toArray())
                .forEach(info -> result.put(String.valueOf(info.id()), info));
        return result;
    }

    public long count() {
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM client", Long.class);
        return total == null ? 0 : total;
    }
}
