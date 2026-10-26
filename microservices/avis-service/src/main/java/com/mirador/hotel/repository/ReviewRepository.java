package com.mirador.hotel.repository;

import java.util.Objects;
import com.mirador.hotel.dto.ReviewDtos;
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
public class ReviewRepository {

    public static final String PENDING = "EN_ATTENTE";
    public static final String APPROVED = "APPROUVE";
    public static final String REJECTED = "REJETE";

    private static LocalDateTime ldt(Timestamp ts) {
        return ts == null ? null : ts.toLocalDateTime();
    }

    private static final RowMapper<ReviewDtos.ReviewResponse> MAPPER = (rs, i) -> new ReviewDtos.ReviewResponse(
            rs.getLong("id"), rs.getLong("client_id"), null,
            rs.getObject("reservation_id") == null ? null : rs.getLong("reservation_id"),
            rs.getInt("rating"), rs.getString("title"), rs.getString("comment_text"), rs.getString("status"),
            rs.getBoolean("flagged"), rs.getString("moderation_comment"), rs.getString("moderated_by"),
            ldt(rs.getTimestamp("moderated_at")), ldt(rs.getTimestamp("created_at")));

    private final JdbcTemplate jdbcTemplate;

    public ReviewRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long insert(ReviewDtos.ReviewRequest r, boolean flagged) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO avis (client_id, reservation_id, rating, title, comment_text, status, flagged) "
                            + "VALUES (?, ?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, r.clientId());
            if (r.reservationId() == null) {
                ps.setNull(2, java.sql.Types.BIGINT);
            } else {
                ps.setLong(2, r.reservationId());
            }
            ps.setInt(3, r.rating());
            ps.setString(4, r.title());
            ps.setString(5, r.comment());
            ps.setString(6, PENDING);
            ps.setBoolean(7, flagged);
            return ps;
        }, keys);
        return Objects.requireNonNull(keys.getKey(), "Identifiant non genere par la base").longValue();
    }

    public Optional<ReviewDtos.ReviewResponse> findById(long id) {
        return jdbcTemplate.query("SELECT * FROM avis WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    public List<ReviewDtos.ReviewResponse> findAll(String status) {
        StringBuilder sql = new StringBuilder("SELECT * FROM avis");
        List<Object> args = new ArrayList<>();
        if (status != null && !status.isBlank()) {
            sql.append(" WHERE status = ?");
            args.add(status.trim().toUpperCase());
        }
        sql.append(" ORDER BY flagged DESC, id DESC LIMIT 500");
        return jdbcTemplate.query(sql.toString(), MAPPER, args.toArray());
    }

    public List<ReviewDtos.ReviewResponse> approved(int limit) {
        return jdbcTemplate.query("SELECT * FROM avis WHERE status = ? ORDER BY id DESC LIMIT ?", MAPPER, APPROVED, limit);
    }

    public List<Integer> approvedRatings() {
        return jdbcTemplate.queryForList("SELECT rating FROM avis WHERE status = ?", Integer.class, APPROVED);
    }

    public boolean existsForReservation(long reservationId) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM avis WHERE reservation_id = ?", Long.class, reservationId);
        return n != null && n > 0;
    }

    /** Only a pending review can be moderated. */
    public boolean moderate(long id, String decision, String comment, String moderator) {
        return jdbcTemplate.update(
                "UPDATE avis SET status = ?, moderation_comment = ?, moderated_by = ?, moderated_at = NOW() "
                        + "WHERE id = ? AND status = ?", decision, comment, moderator, id, PENDING) > 0;
    }

    public int delete(long id) {
        return jdbcTemplate.update("DELETE FROM avis WHERE id = ?", id);
    }
}
