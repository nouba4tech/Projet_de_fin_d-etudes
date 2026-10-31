package com.mirador.hotel.repository;

import com.mirador.hotel.dto.IdentityDtos;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Repository
public class IdentityVerificationRepository {

    /** Saved while the face check still runs in the background (5 minutes at most). */
    public static final String PENDING = "EN_COURS";
    public static final String VERIFIED = "VERIFIEE";
    public static final String TO_REVIEW = "A_REVOIR";
    public static final String REJECTED = "REJETEE";

    /** Distance between face descriptors under which the selfie and the ID photo are taken as the same person. */
    public static final BigDecimal MATCH_THRESHOLD = new BigDecimal("0.55");

    private static final String COLUMNS = """
            id, client_id, document_type, document_number, face_distance, liveness_passed, status, checked_by,
            decided_by, decided_at, reservation_id, purge_after, purged_at, created_at""";

    private static final RowMapper<IdentityDtos.VerificationResponse> MAPPER = (rs, i) -> {
        BigDecimal distance = rs.getBigDecimal("face_distance");
        Timestamp decidedAt = rs.getTimestamp("decided_at");
        return new IdentityDtos.VerificationResponse(
                rs.getLong("id"),
                rs.getLong("client_id"),
                rs.getString("document_type"),
                rs.getString("document_number"),
                distance,
                distance != null && distance.compareTo(MATCH_THRESHOLD) <= 0,
                rs.getBoolean("liveness_passed"),
                rs.getString("status"),
                rs.getString("checked_by"),
                rs.getString("decided_by"),
                decidedAt == null ? null : decidedAt.toLocalDateTime(),
                rs.getObject("reservation_id") == null ? null : rs.getLong("reservation_id"),
                rs.getDate("purge_after").toLocalDate(),
                rs.getTimestamp("purged_at") != null,
                rs.getTimestamp("created_at").toLocalDateTime());
    };

    private final JdbcTemplate jdbcTemplate;

    public IdentityVerificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long insert(IdentityDtos.VerificationRequest request, byte[] recto, byte[] verso, byte[] selfie,
                       String status, String checkedBy, LocalDate purgeAfter) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_identity_verification (
                        client_id, document_type, document_number, recto_enc, verso_enc, selfie_enc,
                        face_distance, liveness_passed, status, consent_at, checked_by, purge_after
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, request.clientId());
            statement.setString(2, request.documentType().trim());
            statement.setString(3, request.documentNumber().trim());
            statement.setBytes(4, recto);
            statement.setBytes(5, verso);
            statement.setBytes(6, selfie);
            statement.setBigDecimal(7, request.faceDistance());
            statement.setBoolean(8, request.livenessPassed());
            statement.setString(9, status);
            statement.setTimestamp(10, Timestamp.valueOf(LocalDateTime.now()));
            statement.setString(11, checkedBy);
            statement.setDate(12, Date.valueOf(purgeAfter));
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible d'enregistrer la verification d'identite.");
        }
        return key.longValue();
    }

    public boolean clientExists(long clientId) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM client WHERE code_client = ?", Integer.class, clientId);
        return count != null && count > 0;
    }

    public Optional<IdentityDtos.VerificationResponse> findById(long id) {
        return jdbcTemplate.query("SELECT " + COLUMNS + " FROM app_identity_verification WHERE id = ?", MAPPER, id)
                .stream().findFirst();
    }

    public List<IdentityDtos.VerificationResponse> findByClient(long clientId) {
        return jdbcTemplate.query(
                "SELECT " + COLUMNS + " FROM app_identity_verification WHERE client_id = ? ORDER BY id DESC", MAPPER, clientId);
    }

    public List<IdentityDtos.VerificationResponse> findLatest(int limit) {
        return jdbcTemplate.query("SELECT " + COLUMNS + " FROM app_identity_verification ORDER BY id DESC LIMIT ?", MAPPER, limit);
    }

    /** part: recto, verso or selfie. Empty once the documents were purged. */
    public Optional<byte[]> findDocument(long id, String part) {
        String column = switch (part) {
            case "recto" -> "recto_enc";
            case "verso" -> "verso_enc";
            case "selfie" -> "selfie_enc";
            default -> throw new IllegalArgumentException(part);
        };
        return jdbcTemplate.query("SELECT " + column + " AS doc FROM app_identity_verification WHERE id = ?",
                (rs, i) -> rs.getBytes("doc"), id).stream().filter(Objects::nonNull).findFirst();
    }

    public void recordResult(long id, BigDecimal faceDistance, boolean livenessPassed, String status) {
        jdbcTemplate.update("""
                UPDATE app_identity_verification
                SET face_distance = ?, liveness_passed = ?, status = ?, decided_by = 'automatique', decided_at = ?
                WHERE id = ? AND status = ?
                """, faceDistance, livenessPassed, status, Timestamp.valueOf(LocalDateTime.now()), id, PENDING);
    }

    /** Checks still running after the allowed delay (counted by the database clock, like created_at). */
    public List<Long> findPendingOlderThan(int minutes) {
        return jdbcTemplate.queryForList("""
                SELECT id FROM app_identity_verification
                WHERE status = ? AND created_at < NOW() - INTERVAL ? MINUTE
                """, Long.class, PENDING, minutes);
    }

    public record ClientContact(String name, String email, String phone) {
    }

    public Optional<ClientContact> findClientContact(long clientId) {
        return jdbcTemplate.query("""
                SELECT COALESCE(NULLIF(nom_client, ''), nom, 'Client') AS name, email, COALESCE(numero, contact) AS phone
                FROM client WHERE code_client = ?
                """, (rs, i) -> new ClientContact(rs.getString("name"), rs.getString("email"), rs.getString("phone")),
                clientId).stream().findFirst();
    }

    /** A booking made while the check was running goes back to "En attente" when the check fails. */
    public void putReservationOnHold(long reservationId) {
        jdbcTemplate.update("""
                UPDATE app_reservation_state SET status_label = 'En attente'
                WHERE occupation_code = ? AND status_label = 'Confirmée'
                """, reservationId);
    }

    public void decide(long id, String status, String decidedBy) {
        jdbcTemplate.update("UPDATE app_identity_verification SET status = ?, decided_by = ?, decided_at = ? WHERE id = ?",
                status, decidedBy, Timestamp.valueOf(LocalDateTime.now()), id);
    }

    /** Links the check to the booking it allowed, once: false when it was already used for another booking. */
    public boolean attachReservation(long id, long reservationId, LocalDate purgeAfter) {
        return jdbcTemplate.update("""
                UPDATE app_identity_verification SET reservation_id = ?, purge_after = ?
                WHERE id = ? AND reservation_id IS NULL
                """, reservationId, Date.valueOf(purgeAfter), id) == 1;
    }

    /** Erases the images whose retention period is over; the record itself stays for the audit trail. */
    public List<Long> purgeExpired(LocalDate today) {
        List<Long> ids = jdbcTemplate.queryForList(
                "SELECT id FROM app_identity_verification WHERE purged_at IS NULL AND purge_after < ?",
                Long.class, Date.valueOf(today));
        for (Long id : ids) {
            jdbcTemplate.update("""
                    UPDATE app_identity_verification
                    SET recto_enc = NULL, verso_enc = NULL, selfie_enc = NULL, purged_at = ?
                    WHERE id = ?
                    """, Timestamp.valueOf(LocalDateTime.now()), id);
        }
        return ids;
    }
}
