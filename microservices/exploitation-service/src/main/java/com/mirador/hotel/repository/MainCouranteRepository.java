package com.mirador.hotel.repository;

import com.mirador.hotel.dto.MainCouranteDtos;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class MainCouranteRepository {

    private final JdbcTemplate jdbcTemplate;

    public MainCouranteRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MainCouranteDtos.MainCouranteResponse> findAll() {
        return jdbcTemplate.query("""
                SELECT code_entry, entry_date, entry_time, category, priority, title, description, location,
                       reported_by, assigned_to, status, resolution, resolved_by, resolved_at, created_at
                FROM main_courante
                ORDER BY entry_date DESC, code_entry DESC
                """, (rs, rowNum) -> mapEntry(rs));
    }

    public Optional<MainCouranteDtos.MainCouranteResponse> findById(long id) {
        return jdbcTemplate.query("""
                SELECT code_entry, entry_date, entry_time, category, priority, title, description, location,
                       reported_by, assigned_to, status, resolution, resolved_by, resolved_at, created_at
                FROM main_courante
                WHERE code_entry = ?
                """, (rs, rowNum) -> mapEntry(rs), id).stream().findFirst();
    }

    public long insert(MainCouranteDtos.MainCouranteRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO main_courante (
                        entry_date, entry_time, category, priority, title, description, location,
                        reported_by, assigned_to, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setObject(1, LocalDate.parse(request.entryDate().trim()));
            statement.setString(2, ValueUtils.coalesce(request.entryTime(), ""));
            statement.setString(3, request.category().trim());
            statement.setString(4, request.priority().trim());
            statement.setString(5, request.title().trim());
            statement.setString(6, ValueUtils.trimToNull(request.description()));
            statement.setString(7, ValueUtils.trimToNull(request.location()));
            statement.setString(8, ValueUtils.trimToNull(request.reportedBy()));
            statement.setString(9, ValueUtils.trimToNull(request.assignedTo()));
            statement.setString(10, request.status().trim());
            statement.setTimestamp(11, Timestamp.valueOf(LocalDateTime.now()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant de l'entree main courante.");
        }
        return key.longValue();
    }

    public void updateStatus(long id, String status) {
        jdbcTemplate.update("""
                UPDATE main_courante
                SET status = ?
                WHERE code_entry = ?
                """, status.trim(), id);
    }

    public void resolve(long id, String resolution, String resolvedBy) {
        jdbcTemplate.update("""
                UPDATE main_courante
                SET status = 'resolved', resolution = ?, resolved_by = ?, resolved_at = ?
                WHERE code_entry = ?
                """,
                ValueUtils.trimToNull(resolution),
                ValueUtils.trimToNull(resolvedBy),
                Timestamp.valueOf(LocalDateTime.now()),
                id);
    }

    public void delete(long id) {
        jdbcTemplate.update("DELETE FROM main_courante WHERE code_entry = ?", id);
    }

    private MainCouranteDtos.MainCouranteResponse mapEntry(ResultSet rs) throws SQLException {
        java.sql.Date entryDate = rs.getDate("entry_date");
        Timestamp resolvedAt = rs.getTimestamp("resolved_at");
        Timestamp createdAt = rs.getTimestamp("created_at");

        return new MainCouranteDtos.MainCouranteResponse(
                rs.getLong("code_entry"),
                entryDate == null ? null : entryDate.toLocalDate().toString(),
                rs.getString("entry_time"),
                rs.getString("category"),
                rs.getString("priority"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("location"),
                rs.getString("reported_by"),
                rs.getString("assigned_to"),
                rs.getString("status"),
                rs.getString("resolution"),
                rs.getString("resolved_by"),
                resolvedAt == null ? null : resolvedAt.toLocalDateTime().toString(),
                createdAt == null ? null : createdAt.toLocalDateTime().toString());
    }
}
