package com.mirador.hotel.repository;

import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@Repository
public class InternalFinanceRepository {

    private final JdbcTemplate jdbcTemplate;

    public InternalFinanceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public BigDecimal revenueToday() {
        return ValueUtils.bigDecimal(jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount_value), 0) FROM app_finance_transaction "
                        + "WHERE transaction_type = 'Recette' AND transaction_date = CURRENT_DATE()", BigDecimal.class));
    }

    public Map<String, BigDecimal> revenueByDay(LocalDate from, LocalDate to) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        jdbcTemplate.query(
                "SELECT transaction_date AS day, COALESCE(SUM(amount_value), 0) AS total FROM app_finance_transaction "
                        + "WHERE transaction_type = 'Recette' AND transaction_date BETWEEN ? AND ? GROUP BY transaction_date",
                rs -> {
                    result.put(rs.getDate("day").toLocalDate().toString(), rs.getBigDecimal("total"));
                },
                java.sql.Date.valueOf(from), java.sql.Date.valueOf(to));
        return result;
    }
}
