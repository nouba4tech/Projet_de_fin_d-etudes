package com.mirador.hotel.repository;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/** Read models exposed to the other microservices through /internal/rooms. */
@Repository
public class InternalRoomRepository {

    private final JdbcTemplate jdbcTemplate;

    public InternalRoomRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<RemoteApi.RoomInfo> findInfo(String code) {
        return jdbcTemplate.query(
                "SELECT c.code_chambre, COALESCE(t.libelle, 'Standard') AS type_label, COALESCE(t.nuite, 0) AS rate "
                        + "FROM chambre c LEFT JOIN type_chambre t ON t.codetype = c.code_type WHERE c.code_chambre = ?",
                (rs, i) -> new RemoteApi.RoomInfo(rs.getString("code_chambre"), rs.getString("type_label"),
                        ValueUtils.bigDecimal(rs.getBigDecimal("rate"))),
                code.trim()).stream().findFirst();
    }

    public Map<String, String> typeLabels(Collection<String> codes) {
        Map<String, String> result = new HashMap<>();
        if (codes.isEmpty()) {
            return result;
        }
        String placeholders = String.join(",", java.util.Collections.nCopies(codes.size(), "?"));
        jdbcTemplate.query(
                "SELECT c.code_chambre, COALESCE(t.libelle, 'Standard') AS type_label FROM chambre c "
                        + "LEFT JOIN type_chambre t ON t.codetype = c.code_type WHERE c.code_chambre IN (" + placeholders + ")",
                rs -> {
                    result.put(rs.getString("code_chambre"), rs.getString("type_label"));
                },
                codes.stream().map(String::trim).toArray());
        return result;
    }

    public RemoteApi.RoomsSummary summary() {
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM chambre", Long.class);
        Long cleaning = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_room_status WHERE status_label = 'Nettoyage' OR cleaning_status = 'Nettoyage'",
                Long.class);
        return new RemoteApi.RoomsSummary(total == null ? 0 : total, cleaning == null ? 0 : cleaning);
    }
}
