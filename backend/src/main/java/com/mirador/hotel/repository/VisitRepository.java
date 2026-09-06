package com.mirador.hotel.repository;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.util.DateTimeMapper;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class VisitRepository {

    private final JdbcTemplate jdbcTemplate;

    public VisitRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OperationsDtos.VisitResponse> findAll() {
        return jdbcTemplate.query("""
                SELECT code_visite, code_occupant, nom, prenom, observation, date_debut, date_fin
                FROM visite
                ORDER BY code_visite DESC
                """, (rs, rowNum) -> new OperationsDtos.VisitResponse(
                rs.getLong("code_visite"),
                rs.getString("nom"),
                rs.getString("prenom"),
                rs.getString("observation"),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("date_debut")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("date_fin")),
                rs.getLong("code_occupant")));
    }

    public Optional<OperationsDtos.VisitResponse> findById(long visitId) {
        return jdbcTemplate.query("""
                SELECT code_visite, code_occupant, nom, prenom, observation, date_debut, date_fin
                FROM visite
                WHERE code_visite = ?
                """, (rs, rowNum) -> new OperationsDtos.VisitResponse(
                rs.getLong("code_visite"),
                rs.getString("nom"),
                rs.getString("prenom"),
                rs.getString("observation"),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("date_debut")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("date_fin")),
                rs.getLong("code_occupant")), visitId).stream().findFirst();
    }

    public long create(OperationsDtos.VisitRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO visite (
                        code_occupant, nom, prenom, observation, date_debut, date_fin
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            if (request.occupantId() != null) {
                statement.setLong(1, request.occupantId());
            } else {
                statement.setNull(1, java.sql.Types.INTEGER);
            }
            statement.setString(2, ValueUtils.coalesce(request.name(), "").trim());
            statement.setString(3, ValueUtils.coalesce(request.firstName(), "").trim());
            statement.setString(4, ValueUtils.coalesce(request.observation(), "").trim());
            statement.setTimestamp(5, DateTimeMapper.toTimestamp(request.startDate()));
            statement.setTimestamp(6, DateTimeMapper.toTimestamp(request.endDate()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant de la visite.");
        }
        return key.longValue();
    }

    public void update(long visitId, OperationsDtos.VisitRequest request) {
        jdbcTemplate.update("""
                UPDATE visite
                SET code_occupant = ?, nom = ?, prenom = ?, observation = ?,
                    date_debut = ?, date_fin = ?
                WHERE code_visite = ?
                """,
                request.occupantId(),
                ValueUtils.coalesce(request.name(), "").trim(),
                ValueUtils.coalesce(request.firstName(), "").trim(),
                ValueUtils.coalesce(request.observation(), "").trim(),
                DateTimeMapper.toTimestamp(request.startDate()),
                DateTimeMapper.toTimestamp(request.endDate()),
                visitId);
    }

    public void delete(long visitId) {
        jdbcTemplate.update("DELETE FROM visite WHERE code_visite = ?", visitId);
    }
}
