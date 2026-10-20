package com.mirador.hotel.repository;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.util.DateTimeMapper;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    public List<String> occupiedRoomsOn(LocalDate day) {
        return jdbcTemplate.queryForList(
                "SELECT DISTINCT o.code_chambre FROM occupation o "
                        + "LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code "
                        + "WHERE " + NOT_CANCELLED + " AND DATE(o.date_debut) <= ? AND DATE(o.date_fin) > ?",
                String.class, java.sql.Date.valueOf(day), java.sql.Date.valueOf(day));
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

    public RemoteApi.ReservationStats statsToday() {
        long occupied = occupiedRoomsOn(LocalDate.now()).size();
        Long pending = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM occupation o LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code "
                        + "WHERE COALESCE(ars.status_label, 'Confirmée') = 'En attente' AND DATE(o.date_debut) >= CURRENT_DATE()",
                Long.class);
        Long active = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM occupation o LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code "
                        + "WHERE " + NOT_CANCELLED + " AND DATE(o.date_fin) >= CURRENT_DATE()",
                Long.class);
        return new RemoteApi.ReservationStats(occupied, pending == null ? 0 : pending, active == null ? 0 : active);
    }

    public Map<String, Long> occupancy(LocalDate from, LocalDate to) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            result.put(day.toString(), (long) occupiedRoomsOn(day).size());
        }
        return result;
    }

    public List<RemoteApi.ReservationInfo> arrivals(LocalDate day) {
        return jdbcTemplate.query(INFO_SELECT + " WHERE " + NOT_CANCELLED + " AND DATE(o.date_debut) = ? ORDER BY o.code",
                INFO_MAPPER, java.sql.Date.valueOf(day));
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
