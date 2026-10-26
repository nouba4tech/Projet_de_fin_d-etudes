package com.mirador.hotel.repository;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.util.DateTimeMapper;
import com.mirador.hotel.util.RefreshingCache;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

/** Read/write models exposed to the other microservices through /internal/reservations. */
@Repository
public class InternalReservationRepository {

    private static final String NOT_CANCELLED =
            "COALESCE(ars.status_label, 'Confirmée') NOT IN ('Annulée', 'Annulee', 'Cancelled')";

    private static final String INFO_SELECT = """
            SELECT o.code, o.code_client, o.code_chambre, DATE(o.date_debut) AS check_in, DATE(o.date_fin) AS check_out,
                   COALESCE(ars.status_label, 'Confirmée') AS status, COALESCE(ars.total_amount, 0) AS total_amount,
                   o.code_facture
            FROM occupation o
            LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
            """;

    private static final RowMapper<RemoteApi.ReservationInfo> INFO_MAPPER = (rs, i) -> new RemoteApi.ReservationInfo(
            rs.getLong("code"),
            rs.getLong("code_client"),
            rs.getString("code_chambre"),
            DateTimeMapper.toLocalDate(rs.getDate("check_in")),
            DateTimeMapper.toLocalDate(rs.getDate("check_out")),
            rs.getString("status"),
            ValueUtils.bigDecimal(rs.getBigDecimal("total_amount")),
            ValueUtils.trimToNull(rs.getString("code_facture")));

    private final JdbcTemplate jdbcTemplate;

    public InternalReservationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Which of the given rooms are occupied on that day (the caller always asks about a bounded page of rooms). */
    public List<String> occupiedRoomsOn(LocalDate day, Collection<String> roomCodes) {
        if (roomCodes.isEmpty()) {
            return List.of();
        }
        List<Object> args = new ArrayList<>(roomCodes);
        args.add(Timestamp.valueOf(day.plusDays(1).atStartOfDay()));
        args.add(Timestamp.valueOf(day.plusDays(1).atStartOfDay()));
        return jdbcTemplate.queryForList(
                "SELECT DISTINCT o.code_chambre FROM occupation o "
                        + "LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code "
                        + "WHERE o.code_chambre IN (" + String.join(",", Collections.nCopies(roomCodes.size(), "?")) + ") "
                        + "AND " + NOT_CANCELLED + " AND o.date_debut < ? AND o.date_fin >= ?",
                String.class, args.toArray());
    }

    /**
     * Number of occupied rooms on that day. Counted in the database (never by fetching the room list) and kept for
     * one minute: with hundreds of thousands of reservations the count takes seconds, and the dashboard asks for it
     * on every display.
     */
    public long countOccupiedRoomsOn(LocalDate day) {
        return cached("occupied:" + day, () -> {
            Long n = jdbcTemplate.queryForObject(
                    "SELECT COUNT(DISTINCT o.code_chambre) FROM occupation o "
                            + "LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code "
                            + "WHERE " + NOT_CANCELLED + " AND o.date_debut < ? AND o.date_fin >= ?",
                    Long.class, Timestamp.valueOf(day.plusDays(1).atStartOfDay()),
                    Timestamp.valueOf(day.plusDays(1).atStartOfDay()));
            return n == null ? 0L : n;
        });
    }

    public long countByRoom(String roomCode) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM occupation WHERE code_chambre = ?", Long.class, roomCode.trim());
        return n == null ? 0 : n;
    }

    public long countByClient(long clientId) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM occupation WHERE code_client = ?", Long.class, clientId);
        return n == null ? 0 : n;
    }

    public Map<String, RemoteApi.ClientStat> clientStats() {
        Map<String, RemoteApi.ClientStat> result = new LinkedHashMap<>();
        jdbcTemplate.query("SELECT code_client, COUNT(*) AS total_stays, MAX(date_fin) AS last_stay FROM occupation GROUP BY code_client",
                rs -> {
                    result.put(String.valueOf(rs.getLong("code_client")), new RemoteApi.ClientStat(
                            rs.getLong("total_stays"), DateTimeMapper.toLocalDate(rs.getDate("last_stay"))));
                });
        return result;
    }

    public Map<String, RemoteApi.ClientStat> clientStats(List<Long> clientIds) {
        Map<String, RemoteApi.ClientStat> result = new LinkedHashMap<>();
        if (clientIds.isEmpty()) return result;
        String placeholders = String.join(",", java.util.Collections.nCopies(clientIds.size(), "?"));
        jdbcTemplate.query("SELECT code_client, COUNT(*) AS total_stays, MAX(date_fin) AS last_stay FROM occupation WHERE code_client IN (" + placeholders + ") GROUP BY code_client",
                (RowCallbackHandler) rs -> result.put(String.valueOf(rs.getLong("code_client")), new RemoteApi.ClientStat(
                        rs.getLong("total_stays"), DateTimeMapper.toLocalDate(rs.getDate("last_stay")))), clientIds.toArray());
        return result;
    }

    /** Dashboard figures of the day, kept for one minute (see countOccupiedRoomsOn). */
    public RemoteApi.ReservationStats statsToday() {
        LocalDate today = LocalDate.now();
        long occupied = countOccupiedRoomsOn(today);
        return cached("stats:" + today, () -> {
            Long pending = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM occupation o LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code "
                            + "WHERE COALESCE(ars.status_label, 'Confirmée') = 'En attente' AND o.date_debut >= CURRENT_DATE()",
                    Long.class);
            Long active = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM occupation o LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code "
                            + "WHERE " + NOT_CANCELLED + " AND o.date_fin >= CURRENT_DATE()",
                    Long.class);
            return new RemoteApi.ReservationStats(occupied, pending == null ? 0 : pending, active == null ? 0 : active);
        });
    }

    public Map<String, Long> occupancy(LocalDate from, LocalDate to) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            result.put(day.toString(), countOccupiedRoomsOn(day));
        }
        return result;
    }

    // dashboard counts: recomputed in the background once a minute, never while a visitor waits
    private final RefreshingCache cache = new RefreshingCache("reservations-stats", Duration.ofMinutes(1));

    private <T> T cached(String key, Supplier<T> loader) {
        return cache.get(key, loader);
    }

    public List<String> occupiedRoomsBetween(LocalDate from, LocalDate to) {
        return jdbcTemplate.queryForList(
                "SELECT DISTINCT o.code_chambre FROM occupation o "
                        + "LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code "
                        + "WHERE " + NOT_CANCELLED + " AND o.date_debut < ? AND o.date_fin >= ?",
                String.class, java.sql.Timestamp.valueOf(to.atStartOfDay()),
                java.sql.Timestamp.valueOf(from.plusDays(1).atStartOfDay()));
    }

    public List<RemoteApi.ReservationInfo> byClient(long clientId) {
        return jdbcTemplate.query(INFO_SELECT + " WHERE o.code_client = ? ORDER BY o.date_debut DESC", INFO_MAPPER, clientId);
    }

    /** Sets the status of one reservation and appends a note to its observation. */
    public void cancel(long reservationId, String status, String note) {
        jdbcTemplate.update("""
                INSERT INTO app_reservation_state (occupation_code, status_label, total_amount, created_at)
                VALUES (?, ?, 0, NOW())
                ON DUPLICATE KEY UPDATE status_label = VALUES(status_label)
                """, reservationId, status);
        jdbcTemplate.update("UPDATE occupation SET observation = TRIM(CONCAT(COALESCE(observation, ''), ' ', ?)) WHERE code = ?",
                note, reservationId);
    }

    public List<RemoteApi.ReservationInfo> arrivals(LocalDate day) {
        return jdbcTemplate.query(INFO_SELECT + " WHERE " + NOT_CANCELLED + " AND o.date_debut >= ? AND o.date_debut < ? ORDER BY o.code",
                INFO_MAPPER, java.sql.Timestamp.valueOf(day.atStartOfDay()),
                java.sql.Timestamp.valueOf(day.plusDays(1).atStartOfDay()));
    }

    public Optional<RemoteApi.ReservationInfo> findById(long id) {
        return jdbcTemplate.query(INFO_SELECT + " WHERE o.code = ?", INFO_MAPPER, id).stream().findFirst();
    }

    public Optional<RemoteApi.ReservationInfo> findByInvoice(String invoiceCode) {
        return jdbcTemplate.query(INFO_SELECT + " WHERE o.code_facture = ? LIMIT 1", INFO_MAPPER, invoiceCode).stream().findFirst();
    }

    /** Sets the reservation status; returns the previous one, or empty when the invoice has no reservation. */
    public Optional<String> updateStatusByInvoice(String invoiceCode, String newStatus) {
        Optional<RemoteApi.ReservationInfo> current = findByInvoice(invoiceCode);
        if (current.isEmpty()) {
            return Optional.empty();
        }
        jdbcTemplate.update("""
                INSERT INTO app_reservation_state (occupation_code, status_label, total_amount, created_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status_label = VALUES(status_label)
                """,
                current.get().id(), newStatus, ValueUtils.bigDecimal(current.get().totalAmount()),
                Timestamp.valueOf(LocalDateTime.now()));
        return Optional.of(current.get().status());
    }
}
