package com.mirador.hotel.repository;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Repository
public class DashboardRepository {

    private final JdbcTemplate jdbcTemplate;

    public DashboardRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public HotelDtos.DashboardSummaryResponse getDashboardSummary() {
        Long totalRooms = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM chambre", Long.class);
        Long occupiedRooms = jdbcTemplate.queryForObject("""
                SELECT COUNT(DISTINCT o.code_chambre)
                FROM occupation o
                LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
                WHERE COALESCE(ars.status_label, 'Confirmée') NOT IN ('Annulée', 'Annulee', 'Cancelled')
                  AND CURRENT_DATE() >= DATE(o.date_debut)
                  AND CURRENT_DATE() < DATE(o.date_fin)
                """, Long.class);
        Long pendingCheckins = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM occupation o
                LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
                WHERE COALESCE(ars.status_label, 'Confirmée') = 'En attente'
                  AND DATE(o.date_debut) >= CURRENT_DATE()
                """, Long.class);
        Long roomsCleaning = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM app_room_status
                WHERE status_label = 'Nettoyage' OR cleaning_status = 'Nettoyage'
                """, Long.class);
        Long activeClients = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM client", Long.class);
        Long activeReservations = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM occupation o
                LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
                WHERE COALESCE(ars.status_label, 'Confirmée') NOT IN ('Annulée', 'Annulee', 'Cancelled')
                  AND DATE(o.date_fin) >= CURRENT_DATE()
                """, Long.class);

        BigDecimal reservationRevenue = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(net), 0)
                FROM facture
                WHERE DATE(date_facture) = CURRENT_DATE()
                """, BigDecimal.class);

        BigDecimal financeRevenue = jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(amount_value), 0)
                FROM app_finance_transaction
                WHERE transaction_type = 'Recette'
                  AND transaction_date = CURRENT_DATE()
                """, BigDecimal.class);

        long safeTotalRooms = totalRooms == null ? 0L : totalRooms;
        long safeOccupiedRooms = occupiedRooms == null ? 0L : occupiedRooms;
        double occupancyRate = safeTotalRooms == 0
                ? 0
                : Math.round((safeOccupiedRooms * 10000.0) / safeTotalRooms) / 100.0;

        return new HotelDtos.DashboardSummaryResponse(
                occupancyRate,
                ValueUtils.bigDecimal(reservationRevenue).add(ValueUtils.bigDecimal(financeRevenue)),
                pendingCheckins == null ? 0L : pendingCheckins,
                roomsCleaning == null ? 0L : roomsCleaning,
                safeTotalRooms,
                safeOccupiedRooms,
                activeClients == null ? 0L : activeClients,
                activeReservations == null ? 0L : activeReservations);
    }

    public HotelDtos.RevenueChartResponse getRevenueChart() {
        Long totalRooms = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM chambre", Long.class);
        long safeTotalRooms = totalRooms == null ? 1L : Math.max(totalRooms, 1L);

        List<HotelDtos.RevenueChartPoint> points = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            String iso = day.toString();
            String rawLabel = day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.FRENCH);
            String dayLabel = rawLabel.substring(0, 1).toUpperCase()
                    + rawLabel.substring(1, Math.min(3, rawLabel.length()));

            BigDecimal revFacture = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(net), 0) FROM facture WHERE DATE(date_facture) = ?",
                    BigDecimal.class, iso);

            BigDecimal revFinance = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(amount_value), 0) FROM app_finance_transaction WHERE transaction_type = 'Recette' AND transaction_date = ?",
                    BigDecimal.class, iso);

            BigDecimal totalRevenue = ValueUtils.bigDecimal(revFacture).add(ValueUtils.bigDecimal(revFinance));

            Long occupiedRoomsDay = jdbcTemplate.queryForObject("""
                    SELECT COUNT(DISTINCT o.code_chambre)
                    FROM occupation o
                    LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
                    WHERE COALESCE(ars.status_label, 'Confirmée') NOT IN ('Annulée', 'Annulee', 'Cancelled')
                      AND DATE(o.date_debut) <= ?
                      AND DATE(o.date_fin) > ?
                    """, Long.class, iso, iso);

            long safeOcc = occupiedRoomsDay == null ? 0L : occupiedRoomsDay;
            double occ = Math.round((safeOcc * 10000.0) / safeTotalRooms) / 100.0;

            points.add(new HotelDtos.RevenueChartPoint(dayLabel, iso, totalRevenue, occ));
        }

        return new HotelDtos.RevenueChartResponse(points);
    }
}
