package com.mirador.hotel.repository;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.util.DateTimeMapper;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ClientRepository {

    private final JdbcTemplate jdbcTemplate;

    public ClientRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<HotelDtos.ClientResponse> findAll() {
        String sql = baseSelect() + " ORDER BY c.code_client DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapClient(rs));
    }

    public Optional<HotelDtos.ClientResponse> findById(long clientId) {
        String sql = baseSelect() + " WHERE c.code_client = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapClient(rs), clientId).stream().findFirst();
    }

    public long create(HotelDtos.ClientRequest request) {
        String accountNumber = generateNextClientAccountNumber();
        String clientType = ValueUtils.coalesce(request.clientType(), "Personne physique");
        String companyName = ValueUtils.trimToNull(request.companyName());
        String displayName = buildClientDisplayName(request.firstName(), request.lastName(), clientType, companyName);

        jdbcTemplate.update("""
                INSERT INTO lescompte (numcompte, numero, libelle_compte, solde, cumul_depot, cumul_retrait, type_compte)
                VALUES (?, '411', ?, 0, 0, 0, 'C')
                """,
                accountNumber,
                displayName);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO client (nom_client, contact, type_client, solde, numero)
                    VALUES (?, ?, ?, 0, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, displayName);
            statement.setString(2, ValueUtils.trimToNull(request.phone()));
            statement.setString(3, clientType);
            statement.setString(4, accountNumber);
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant client.");
        }

        long clientId = key.longValue();
        upsertProfile(clientId, request);
        return clientId;
    }

    public void update(long clientId, HotelDtos.ClientRequest request) {
        String clientType = ValueUtils.coalesce(request.clientType(), "Personne physique");
        String companyName = ValueUtils.trimToNull(request.companyName());
        String displayName = buildClientDisplayName(request.firstName(), request.lastName(), clientType, companyName);
        String accountNumber = findAccountNumber(clientId)
                .orElseThrow(() -> new IllegalStateException("Le compte client est introuvable."));

        jdbcTemplate.update("""
                UPDATE client
                SET nom_client = ?, contact = ?, type_client = ?
                WHERE code_client = ?
                """,
                displayName,
                ValueUtils.trimToNull(request.phone()),
                clientType,
                clientId);

        jdbcTemplate.update("""
                UPDATE lescompte
                SET libelle_compte = ?
                WHERE numcompte = ?
                """,
                displayName,
                accountNumber);

        upsertProfile(clientId, request);
    }

    public void delete(long clientId) {
        Long reservations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM occupation WHERE code_client = ?",
                Long.class,
                clientId);

        if (reservations != null && reservations > 0) {
            throw new IllegalStateException("Ce client possede des reservations et ne peut pas etre supprime.");
        }

        jdbcTemplate.update("DELETE FROM app_client_profile WHERE code_client = ?", clientId);
        jdbcTemplate.update("DELETE FROM client WHERE code_client = ?", clientId);
    }

    private String baseSelect() {
        return """
                SELECT
                    c.code_client,
                    c.nom_client,
                    c.contact,
                    c.type_client,
                    c.solde,
                    p.email,
                    p.address_line,
                    p.id_document,
                    p.company_name,
                    p.status_label,
                    p.created_at,
                    stats.total_stays,
                    stats.last_stay
                FROM client c
                LEFT JOIN app_client_profile p ON p.code_client = c.code_client
                LEFT JOIN (
                    SELECT code_client, COUNT(*) AS total_stays, MAX(date_fin) AS last_stay
                    FROM occupation
                    GROUP BY code_client
                ) stats ON stats.code_client = c.code_client
                """;
    }

    private void upsertProfile(long clientId, HotelDtos.ClientRequest request) {
        jdbcTemplate.update("""
                INSERT INTO app_client_profile (
                    code_client,
                    email,
                    address_line,
                    id_document,
                    company_name,
                    status_label,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    email = VALUES(email),
                    address_line = VALUES(address_line),
                    id_document = VALUES(id_document),
                    company_name = VALUES(company_name),
                    status_label = VALUES(status_label)
                """,
                clientId,
                ValueUtils.trimToNull(request.email()),
                ValueUtils.trimToNull(request.address()),
                ValueUtils.trimToNull(request.idDocument()),
                ValueUtils.trimToNull(request.companyName()),
                ValueUtils.coalesce(request.status(), "Actif"),
                Timestamp.valueOf(LocalDateTime.now()));
    }

    private Optional<String> findAccountNumber(long clientId) {
        return jdbcTemplate.query(
                "SELECT numero FROM client WHERE code_client = ?",
                (rs, rowNum) -> rs.getString("numero"),
                clientId).stream().findFirst();
    }

    private String generateNextClientAccountNumber() {
        Long next = jdbcTemplate.queryForObject("""
                SELECT COALESCE(MAX(CAST(numcompte AS UNSIGNED)), 411000000) + 1
                FROM lescompte
                WHERE numcompte LIKE '411%'
                """,
                Long.class);

        return String.valueOf(next == null ? 411000001L : next);
    }

    private String buildClientDisplayName(String firstName, String lastName, String clientType, String companyName) {
        if ("Personne morale".equalsIgnoreCase(ValueUtils.coalesce(clientType, "")) && companyName != null) {
            return companyName;
        }

        String fullName = (ValueUtils.coalesce(firstName, "") + " " + ValueUtils.coalesce(lastName, "")).trim();
        return fullName.isBlank() ? "Client Mirador" : fullName;
    }

    private HotelDtos.ClientResponse mapClient(ResultSet rs) throws SQLException {
        String clientType = ValueUtils.coalesce(rs.getString("type_client"), "Personne physique");
        String companyName = ValueUtils.trimToNull(rs.getString("company_name"));
        String sourceName = companyName != null ? companyName : ValueUtils.coalesce(rs.getString("nom_client"), "");
        NameParts nameParts = splitName(sourceName);

        return new HotelDtos.ClientResponse(
                rs.getLong("code_client"),
                nameParts.firstName(),
                nameParts.lastName(),
                sourceName,
                ValueUtils.trimToNull(rs.getString("email")),
                ValueUtils.trimToNull(rs.getString("contact")),
                ValueUtils.trimToNull(rs.getString("id_document")),
                ValueUtils.trimToNull(rs.getString("address_line")),
                clientType,
                companyName,
                ValueUtils.bigDecimal(rs.getBigDecimal("solde")),
                rs.getLong("total_stays"),
                DateTimeMapper.toLocalDate(rs.getDate("last_stay")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at")),
                ValueUtils.coalesce(rs.getString("status_label"), "Actif"));
    }

    private NameParts splitName(String rawValue) {
        String value = ValueUtils.coalesce(rawValue, "").trim();
        if (value.isEmpty()) {
            return new NameParts("", "");
        }

        String[] parts = value.split("\\s+");
        if (parts.length == 1) {
            return new NameParts(parts[0], "");
        }

        String firstName = parts[0];
        String lastName = value.substring(firstName.length()).trim();
        return new NameParts(firstName, lastName);
    }

    private record NameParts(String firstName, String lastName) {
    }
}
