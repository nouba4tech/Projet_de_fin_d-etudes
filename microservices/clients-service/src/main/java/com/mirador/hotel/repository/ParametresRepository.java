package com.mirador.hotel.repository;

import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ParametresRepository {

    private final JdbcTemplate jdbcTemplate;

    public ParametresRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ===== CLIENTS =====

    public List<ParametresDtos.ClientParametreResponse> findAllClients(String status) {
        String sql = """
                SELECT c.code_client, c.nom_client, c.contact, c.type_client,
                       p.email, p.address_line, p.id_document, p.company_name, p.status_label
                FROM client c
                LEFT JOIN app_client_profile p ON p.code_client = c.code_client
                ORDER BY c.code_client DESC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String displayName = ValueUtils.coalesce(rs.getString("nom_client"), "");
            String[] nameParts = displayName.split("\\s+", 2);
            return new ParametresDtos.ClientParametreResponse(
                    String.valueOf(rs.getLong("code_client")),
                    "CLI-" + rs.getLong("code_client"),
                    nameParts.length > 0 ? nameParts[0] : "",
                    nameParts.length > 1 ? nameParts[1] : "",
                    ValueUtils.trimToNull(rs.getString("email")),
                    ValueUtils.trimToNull(rs.getString("contact")),
                    ValueUtils.trimToNull(rs.getString("address_line")),
                    ValueUtils.trimToNull(rs.getString("id_document")),
                    null, null, null,
                    rs.getString("company_name") != null,
                    ValueUtils.coalesce(rs.getString("status_label"), "Actif"),
                    List.of(), null, null
            );
        });
    }

    public Optional<ParametresDtos.ClientParametreResponse> findClientById(String id) {
        long clientId;
        try { clientId = Long.parseLong(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("""
                SELECT c.code_client, c.nom_client, c.contact, c.type_client,
                       p.email, p.address_line, p.id_document, p.company_name, p.status_label
                FROM client c
                LEFT JOIN app_client_profile p ON p.code_client = c.code_client
                WHERE c.code_client = ?
                """, (rs, rowNum) -> {
            String displayName = ValueUtils.coalesce(rs.getString("nom_client"), "");
            String[] nameParts = displayName.split("\\s+", 2);
            return new ParametresDtos.ClientParametreResponse(
                    String.valueOf(rs.getLong("code_client")),
                    "CLI-" + rs.getLong("code_client"),
                    nameParts.length > 0 ? nameParts[0] : "",
                    nameParts.length > 1 ? nameParts[1] : "",
                    ValueUtils.trimToNull(rs.getString("email")),
                    ValueUtils.trimToNull(rs.getString("contact")),
                    ValueUtils.trimToNull(rs.getString("address_line")),
                    ValueUtils.trimToNull(rs.getString("id_document")),
                    null, null, null,
                    rs.getString("company_name") != null,
                    ValueUtils.coalesce(rs.getString("status_label"), "Actif"),
                    List.of(), null, null
            );
        }, clientId).stream().findFirst();
    }

    public long createClient(ParametresDtos.ClientParametreRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        String displayName = (ValueUtils.coalesce(request.firstName(), "") + " " + ValueUtils.coalesce(request.lastName(), "")).trim();
        final String finalDisplayName = displayName.isBlank() ? "Client Mirador" : displayName;

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO client (nom_client, contact, type_client, solde) VALUES (?, ?, ?, 0)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, finalDisplayName);
            ps.setString(2, ValueUtils.trimToNull(request.phone()));
            ps.setString(3, "Personne physique");
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant du client.");
        long clientId = key.longValue();

        jdbcTemplate.update("""
                INSERT INTO app_client_profile (code_client, email, address_line, id_document, status_label, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE email = VALUES(email), address_line = VALUES(address_line),
                    id_document = VALUES(id_document), status_label = VALUES(status_label)
                """,
                clientId,
                ValueUtils.trimToNull(request.email()),
                ValueUtils.trimToNull(request.address()),
                ValueUtils.trimToNull(request.idNumber()),
                ValueUtils.coalesce(request.status(), "Actif"));

        return clientId;
    }

    public void updateClient(String id, ParametresDtos.ClientParametreRequest request) {
        long clientId;
        try { clientId = Long.parseLong(id); } catch (NumberFormatException e) { return; }

        String displayName = (ValueUtils.coalesce(request.firstName(), "") + " " + ValueUtils.coalesce(request.lastName(), "")).trim();
        if (displayName.isBlank()) displayName = "Client Mirador";

        jdbcTemplate.update("UPDATE client SET nom_client = ?, contact = ? WHERE code_client = ?",
                displayName, ValueUtils.trimToNull(request.phone()), clientId);

        jdbcTemplate.update("""
                INSERT INTO app_client_profile (code_client, email, address_line, id_document, status_label, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE email = VALUES(email), address_line = VALUES(address_line),
                    id_document = VALUES(id_document), status_label = VALUES(status_label)
                """,
                clientId,
                ValueUtils.trimToNull(request.email()),
                ValueUtils.trimToNull(request.address()),
                ValueUtils.trimToNull(request.idNumber()),
                ValueUtils.coalesce(request.status(), "Actif"));
    }

    public void deleteClient(String id) {
        long clientId;
        try { clientId = Long.parseLong(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM app_client_profile WHERE code_client = ?", clientId);
        jdbcTemplate.update("DELETE FROM client WHERE code_client = ?", clientId);
    }
}
