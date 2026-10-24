package com.mirador.hotel.repository;

import java.util.Objects;
import com.mirador.hotel.dto.NotificationDtos;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class NotificationRepository {

    private static LocalDateTime ldt(Timestamp ts) {
        return ts == null ? null : ts.toLocalDateTime();
    }

    private static final RowMapper<NotificationDtos.NotificationResponse> MAPPER = (rs, i) ->
            new NotificationDtos.NotificationResponse(rs.getLong("id"), rs.getString("channel"), rs.getString("recipient"),
                    rs.getString("template_code"), rs.getString("reference_key"), rs.getString("subject"),
                    rs.getString("body"), rs.getString("status"), rs.getString("error_message"),
                    ldt(rs.getTimestamp("created_at")), ldt(rs.getTimestamp("sent_at")));

    private final JdbcTemplate jdbcTemplate;

    public NotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long insertPending(String channel, String recipient, String template, String reference, String subject, String body) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO notification (channel, recipient, template_code, reference_key, subject, body, status) "
                            + "VALUES (?, ?, ?, ?, ?, ?, 'PENDING')", Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, channel);
            ps.setString(2, recipient);
            ps.setString(3, template);
            ps.setString(4, reference);
            ps.setString(5, subject);
            ps.setString(6, body);
            return ps;
        }, keys);
        return Objects.requireNonNull(keys.getKey(), "Identifiant non genere par la base").longValue();
    }

    public void markSent(long id) {
        jdbcTemplate.update("UPDATE notification SET status = 'SENT', sent_at = NOW(), error_message = NULL WHERE id = ?", id);
    }

    public void markFailed(long id, String error) {
        String message = error == null ? "erreur inconnue" : error.length() > 480 ? error.substring(0, 480) : error;
        jdbcTemplate.update("UPDATE notification SET status = 'FAILED', error_message = ? WHERE id = ?", message, id);
    }

    public Optional<NotificationDtos.NotificationResponse> findById(long id) {
        return jdbcTemplate.query("SELECT * FROM notification WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    /** Idempotency lookup: same template + recipient + business reference = same notification. */
    public Optional<NotificationDtos.NotificationResponse> findByKey(String template, String recipient, String reference) {
        return jdbcTemplate.query(
                "SELECT * FROM notification WHERE template_code = ? AND recipient = ? AND reference_key = ?",
                MAPPER, template, recipient, reference).stream().findFirst();
    }

    public List<NotificationDtos.NotificationResponse> findAll(String status, String channel, int limit) {
        StringBuilder sql = new StringBuilder("SELECT * FROM notification WHERE 1 = 1");
        List<Object> args = new ArrayList<>();
        if (status != null && !status.isBlank()) {
            sql.append(" AND status = ?");
            args.add(status.trim().toUpperCase());
        }
        if (channel != null && !channel.isBlank()) {
            sql.append(" AND channel = ?");
            args.add(channel.trim().toUpperCase());
        }
        sql.append(" ORDER BY id DESC LIMIT ?");
        args.add(Math.max(1, Math.min(limit, 500)));
        return jdbcTemplate.query(sql.toString(), MAPPER, args.toArray());
    }
}
