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
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class GuestServiceRepository {

    private final JdbcTemplate jdbcTemplate;

    public GuestServiceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OperationsDtos.GuestServiceResponse> findAll() {
        return jdbcTemplate.query("""
                SELECT id, code_client, service_type, description_text, status_label, requested_at, completed_at, price_amount
                FROM app_service_request
                ORDER BY id DESC
                """, (rs, rowNum) -> new OperationsDtos.GuestServiceResponse(
                rs.getLong("id"),
                rs.getLong("code_client"),
                rs.getString("service_type"),
                rs.getString("description_text"),
                rs.getString("status_label"),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("requested_at")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("completed_at")),
                ValueUtils.bigDecimal(rs.getBigDecimal("price_amount"))));
    }

    public Optional<OperationsDtos.GuestServiceResponse> findById(long serviceId) {
        return jdbcTemplate.query("""
                SELECT id, code_client, service_type, description_text, status_label, requested_at, completed_at, price_amount
                FROM app_service_request
                WHERE id = ?
                """, (rs, rowNum) -> new OperationsDtos.GuestServiceResponse(
                rs.getLong("id"),
                rs.getLong("code_client"),
                rs.getString("service_type"),
                rs.getString("description_text"),
                rs.getString("status_label"),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("requested_at")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("completed_at")),
                ValueUtils.bigDecimal(rs.getBigDecimal("price_amount"))), serviceId).stream().findFirst();
    }

    public long create(OperationsDtos.GuestServiceRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        OffsetDateTime requestedAt = request.requestedAt() == null ? OffsetDateTime.now() : request.requestedAt();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_service_request (
                        code_client, service_type, description_text, status_label, requested_at, completed_at, price_amount
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, request.clientId());
            statement.setString(2, request.serviceType().trim());
            statement.setString(3, request.description().trim());
            statement.setString(4, ValueUtils.coalesce(request.status(), "Demandé"));
            statement.setTimestamp(5, DateTimeMapper.toTimestamp(requestedAt));
            statement.setTimestamp(6, DateTimeMapper.toTimestamp(request.completedAt()));
            statement.setBigDecimal(7, ValueUtils.bigDecimal(request.price()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant du service.");
        }
        return key.longValue();
    }

    public void update(long serviceId, OperationsDtos.GuestServiceRequest request) {
        OffsetDateTime requestedAt = request.requestedAt() == null ? OffsetDateTime.now() : request.requestedAt();
        jdbcTemplate.update("""
                UPDATE app_service_request
                SET code_client = ?, service_type = ?, description_text = ?, status_label = ?,
                    requested_at = ?, completed_at = ?, price_amount = ?
                WHERE id = ?
                """,
                request.clientId(),
                request.serviceType().trim(),
                request.description().trim(),
                ValueUtils.coalesce(request.status(), "Demandé"),
                DateTimeMapper.toTimestamp(requestedAt),
                DateTimeMapper.toTimestamp(request.completedAt()),
                ValueUtils.bigDecimal(request.price()),
                serviceId);
    }

    public void delete(long serviceId) {
        jdbcTemplate.update("DELETE FROM app_service_request WHERE id = ?", serviceId);
    }
}
