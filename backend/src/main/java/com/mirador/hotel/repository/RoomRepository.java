package com.mirador.hotel.repository;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class RoomRepository {

    private static final String ROOM_SELECT = """
            SELECT
                c.code_chambre,
                COALESCE(t.libelle, CONCAT('Type ', COALESCE(c.code_type, 0))) AS room_type,
                COALESCE(t.nuite, 0) AS nightly_rate,
                CASE
                    WHEN COALESCE(arr.status_label, '') IN ('Maintenance', 'Nettoyage') THEN arr.status_label
                    WHEN EXISTS (
                        SELECT 1
                        FROM occupation o
                        LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
                        WHERE o.code_chambre = c.code_chambre
                          AND COALESCE(ars.status_label, 'Confirmée') NOT IN ('Annulée', 'Annulee', 'Cancelled')
                          AND CURRENT_DATE() >= DATE(o.date_debut)
                          AND CURRENT_DATE() < DATE(o.date_fin)
                    ) THEN 'Occupée'
                    ELSE COALESCE(NULLIF(arr.status_label, ''), 'Disponible')
                END AS room_status,
                COALESCE(arr.cleaning_status, 'Prêt') AS cleaning_status,
                arr.description_text,
                arr.capacity_value,
                c.code_type
            FROM chambre c
            LEFT JOIN type_chambre t ON t.codetype = c.code_type
            LEFT JOIN app_room_status arr ON arr.code_chambre = c.code_chambre
            """;

    private final JdbcTemplate jdbcTemplate;

    public RoomRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<HotelDtos.RoomResponse> findAll() {
        return jdbcTemplate.query(ROOM_SELECT + " ORDER BY c.code_chambre", (rs, rowNum) -> mapRoom(rs));
    }

    public Optional<HotelDtos.RoomResponse> findByCode(String codeChambre) {
        return jdbcTemplate.query(
                ROOM_SELECT + " WHERE c.code_chambre = ?",
                (rs, rowNum) -> mapRoom(rs),
                codeChambre.trim()).stream().findFirst();
    }

    public boolean exists(String codeChambre) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM chambre WHERE code_chambre = ?",
                Long.class,
                codeChambre.trim());
        return count != null && count > 0;
    }

    public void create(HotelDtos.RoomRequest request) {
        int roomTypeId = ensureRoomType(
                ValueUtils.coalesce(request.typeLabel(), "Standard"),
                ValueUtils.bigDecimal(request.nightlyRate()));

        jdbcTemplate.update(
                "INSERT INTO chambre (code_chambre, code_type) VALUES (?, ?)",
                request.code().trim(),
                roomTypeId);

        upsertRoomStatus(
                request.code().trim(),
                request.status(),
                request.cleaningStatus(),
                request.description(),
                request.capacity());
    }

    public void update(String codeChambre, HotelDtos.RoomRequest request) {
        RoomInternalRow current = findInternal(codeChambre)
                .orElseThrow(() -> new IllegalStateException("Chambre introuvable."));

        String nextTypeLabel = ValueUtils.coalesce(request.typeLabel(), current.typeLabel());
        BigDecimal nextNightlyRate = request.nightlyRate() == null ? current.nightlyRate() : request.nightlyRate();
        int roomTypeId = ensureRoomType(nextTypeLabel, ValueUtils.bigDecimal(nextNightlyRate));

        jdbcTemplate.update(
                "UPDATE chambre SET code_type = ? WHERE code_chambre = ?",
                roomTypeId,
                codeChambre.trim());

        upsertRoomStatus(
                codeChambre.trim(),
                request.status(),
                request.cleaningStatus(),
                request.description(),
                request.capacity());
    }

    public void delete(String codeChambre) {
        Long reservations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM occupation WHERE code_chambre = ?",
                Long.class,
                codeChambre.trim());

        if (reservations != null && reservations > 0) {
            throw new IllegalStateException("Cette chambre est liee a des reservations et ne peut pas etre supprimee.");
        }

        jdbcTemplate.update("DELETE FROM app_room_status WHERE code_chambre = ?", codeChambre.trim());
        jdbcTemplate.update("DELETE FROM chambre WHERE code_chambre = ?", codeChambre.trim());
    }

    private Optional<RoomInternalRow> findInternal(String codeChambre) {
        return jdbcTemplate.query(
                ROOM_SELECT + " WHERE c.code_chambre = ?",
                (rs, rowNum) -> new RoomInternalRow(
                        rs.getString("code_chambre"),
                        rs.getString("room_type"),
                        ValueUtils.bigDecimal(rs.getBigDecimal("nightly_rate"))),
                codeChambre.trim()).stream().findFirst();
    }

    private int ensureRoomType(String typeLabel, BigDecimal nightlyRate) {
        Integer existing = jdbcTemplate.query("""
                SELECT codetype
                FROM type_chambre
                WHERE LOWER(libelle) = LOWER(?)
                  AND COALESCE(nuite, 0) = ?
                ORDER BY codetype
                LIMIT 1
                """,
                (rs, rowNum) -> rs.getInt("codetype"),
                ValueUtils.coalesce(typeLabel, "Standard"),
                ValueUtils.bigDecimal(nightlyRate)).stream().findFirst().orElse(null);

        if (existing != null) {
            return existing;
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO type_chambre (libelle, nuite, sejour, sieste, numero)
                    VALUES (?, ?, ?, ?, NULL)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, ValueUtils.coalesce(typeLabel, "Standard"));
            statement.setBigDecimal(2, ValueUtils.bigDecimal(nightlyRate));
            statement.setBigDecimal(3, ValueUtils.bigDecimal(nightlyRate));
            statement.setBigDecimal(4, ValueUtils.bigDecimal(nightlyRate));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer le type de chambre cree.");
        }

        return key.intValue();
    }

    private void upsertRoomStatus(String codeChambre, String status, String cleaningStatus, String description, Integer capacity) {
        if (ValueUtils.trimToNull(status) == null
                && ValueUtils.trimToNull(cleaningStatus) == null
                && ValueUtils.trimToNull(description) == null
                && capacity == null) {
            return;
        }

        jdbcTemplate.update("""
                INSERT INTO app_room_status (code_chambre, status_label, cleaning_status, description_text, capacity_value)
                VALUES (?, COALESCE(?, 'Disponible'), COALESCE(?, 'Prêt'), ?, ?)
                ON DUPLICATE KEY UPDATE
                    status_label = COALESCE(VALUES(status_label), status_label),
                    cleaning_status = COALESCE(VALUES(cleaning_status), cleaning_status),
                    description_text = COALESCE(VALUES(description_text), description_text),
                    capacity_value = COALESCE(VALUES(capacity_value), capacity_value)
                """,
                codeChambre,
                ValueUtils.trimToNull(status),
                ValueUtils.trimToNull(cleaningStatus),
                ValueUtils.trimToNull(description),
                capacity);
    }

    private HotelDtos.RoomResponse mapRoom(ResultSet rs) throws SQLException {
        String code = rs.getString("code_chambre");
        return new HotelDtos.RoomResponse(
                code,
                code,
                rs.getString("room_type"),
                ValueUtils.bigDecimal(rs.getBigDecimal("nightly_rate")),
                rs.getString("room_status"),
                rs.getString("cleaning_status"),
                rs.getString("description_text"),
                ValueUtils.integer(rs, "capacity_value"));
    }

    private record RoomInternalRow(
            String code,
            String typeLabel,
            BigDecimal nightlyRate) {
    }
}
