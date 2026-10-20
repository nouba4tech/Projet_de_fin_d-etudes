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

    // ===== ROOM TYPES =====

    public List<ParametresDtos.RoomTypeResponse> findAllRoomTypes() {
        return jdbcTemplate.query("""
                SELECT codetype, libelle, nuite, sejour, sieste, numero
                FROM type_chambre
                ORDER BY codetype
                """, (rs, rowNum) -> new ParametresDtos.RoomTypeResponse(
                String.valueOf(rs.getInt("codetype")),
                ValueUtils.coalesce(rs.getString("numero"), "T" + rs.getInt("codetype")),
                ValueUtils.coalesce(rs.getString("libelle"), "Standard"),
                null,
                null,
                ValueUtils.bigDecimal(rs.getBigDecimal("nuite")),
                List.of(),
                "active",
                null,
                null,
                null
        ));
    }

    public Optional<ParametresDtos.RoomTypeResponse> findRoomTypeById(String id) {
        int typeId;
        try { typeId = Integer.parseInt(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("""
                SELECT codetype, libelle, nuite, sejour, sieste, numero
                FROM type_chambre WHERE codetype = ?
                """, (rs, rowNum) -> new ParametresDtos.RoomTypeResponse(
                String.valueOf(rs.getInt("codetype")),
                ValueUtils.coalesce(rs.getString("numero"), "T" + rs.getInt("codetype")),
                ValueUtils.coalesce(rs.getString("libelle"), "Standard"),
                null, null,
                ValueUtils.bigDecimal(rs.getBigDecimal("nuite")),
                List.of(), "active", null, null, null
        ), typeId).stream().findFirst();
    }

    public int createRoomType(ParametresDtos.RoomTypeRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO type_chambre (libelle, nuite, sejour, sieste, numero) VALUES (?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, ValueUtils.trimToNull(request.name()));
            ps.setBigDecimal(2, request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO);
            ps.setBigDecimal(3, request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO);
            ps.setBigDecimal(4, request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO);
            ps.setString(5, ValueUtils.trimToNull(request.code()));
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant du type de chambre.");
        return key.intValue();
    }

    public void updateRoomType(String id, ParametresDtos.RoomTypeRequest request) {
        int typeId;
        try { typeId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }

        jdbcTemplate.update("UPDATE type_chambre SET libelle = ?, nuite = ?, sejour = ?, sieste = ?, numero = ? WHERE codetype = ?",
                ValueUtils.trimToNull(request.name()),
                request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO,
                request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO,
                request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO,
                ValueUtils.trimToNull(request.code()),
                typeId);
    }

    public void deleteRoomType(String id) {
        int typeId;
        try { typeId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM type_chambre WHERE codetype = ?", typeId);
    }

    // ===== ROOMS =====

    public List<ParametresDtos.RoomResponse> findAllRooms(String status) {
        String sql = """
                SELECT c.code_chambre, COALESCE(t.libelle, CONCAT('Type ', COALESCE(c.code_type, 0))) AS room_type,
                       COALESCE(t.codetype, 0) AS type_id, c.code_type,
                       COALESCE(arr.status_label, 'Disponible') AS room_status,
                       COALESCE(arr.cleaning_status, 'Pret') AS cleaning_status,
                       arr.description_text, arr.capacity_value
                FROM chambre c
                LEFT JOIN type_chambre t ON t.codetype = c.code_type
                LEFT JOIN app_room_status arr ON arr.code_chambre = c.code_chambre
                """ + (status != null ? " WHERE COALESCE(arr.status_label, 'Disponible') = ?" : "") +
                " ORDER BY c.code_chambre";

        if (status != null) {
            return jdbcTemplate.query(sql, (rs, rowNum) -> mapRoomResponse(rs), status);
        }
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapRoomResponse(rs));
    }

    private ParametresDtos.RoomResponse mapRoomResponse(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new ParametresDtos.RoomResponse(
                rs.getString("code_chambre"),
                rs.getString("code_chambre"),
                String.valueOf(rs.getInt("type_id")),
                ValueUtils.coalesce(rs.getString("room_type"), "Standard"),
                null,
                ValueUtils.coalesce(rs.getString("room_status"), "Disponible"),
                ValueUtils.coalesce(rs.getString("cleaning_status"), "Pret"),
                rs.getString("description_text"),
                null, null, null
        );
    }

    public Optional<ParametresDtos.RoomResponse> findRoomById(String id) {
        return jdbcTemplate.query("""
                SELECT c.code_chambre, COALESCE(t.libelle, CONCAT('Type ', COALESCE(c.code_type, 0))) AS room_type,
                       COALESCE(t.codetype, 0) AS type_id, c.code_type,
                       COALESCE(arr.status_label, 'Disponible') AS room_status,
                       COALESCE(arr.cleaning_status, 'Pret') AS cleaning_status,
                       arr.description_text, arr.capacity_value
                FROM chambre c
                LEFT JOIN type_chambre t ON t.codetype = c.code_type
                LEFT JOIN app_room_status arr ON arr.code_chambre = c.code_chambre
                WHERE c.code_chambre = ?
                """, (rs, rowNum) -> mapRoomResponse(rs), id).stream().findFirst();
    }

    public void createRoom(ParametresDtos.RoomRequest request) {
        int typeId = resolveRoomTypeId(request.roomTypeId());
        jdbcTemplate.update("INSERT INTO chambre (code_chambre, code_type) VALUES (?, ?)",
                request.number().trim(), typeId);
    }

    public void updateRoom(String id, ParametresDtos.RoomRequest request) {
        int typeId = resolveRoomTypeId(request.roomTypeId());
        jdbcTemplate.update("UPDATE chambre SET code_type = ? WHERE code_chambre = ?", typeId, id);
    }

    public void deleteRoom(String id) {
        jdbcTemplate.update("DELETE FROM app_room_status WHERE code_chambre = ?", id);
        jdbcTemplate.update("DELETE FROM chambre WHERE code_chambre = ?", id);
    }

    private int resolveRoomTypeId(String roomTypeId) {
        if (roomTypeId == null || roomTypeId.isBlank()) return 1;
        try {
            return Integer.parseInt(roomTypeId);
        } catch (NumberFormatException e) {
            return 1;
        }
    }
}
