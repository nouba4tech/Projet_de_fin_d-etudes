package com.mirador.hotel.repository;

import java.util.Objects;
import com.mirador.hotel.dto.PromotionDtos;
import com.mirador.hotel.model.PromotionCalculator;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class PromotionRepository {

    private static final RowMapper<PromotionDtos.PromotionResponse> MAPPER = (rs, i) -> {
        LocalDate start = rs.getDate("start_date").toLocalDate();
        LocalDate end = rs.getDate("end_date").toLocalDate();
        Integer limit = rs.getObject("usage_limit") == null ? null : rs.getInt("usage_limit");
        int used = rs.getInt("used_count");
        boolean active = rs.getBoolean("active");
        LocalDate today = LocalDate.now();
        boolean valid = active && !today.isBefore(start) && !today.isAfter(end) && (limit == null || used < limit);
        return new PromotionDtos.PromotionResponse(rs.getLong("id"), rs.getString("code"), rs.getString("libelle"),
                rs.getString("discount_type"), ValueUtils.bigDecimal(rs.getBigDecimal("discount_value")),
                ValueUtils.bigDecimal(rs.getBigDecimal("min_amount")), start, end, limit, used, active, valid);
    };

    private final JdbcTemplate jdbcTemplate;

    public PromotionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PromotionDtos.PromotionResponse> findAll(Boolean onlyCurrentlyValid) {
        List<PromotionDtos.PromotionResponse> all = jdbcTemplate.query("SELECT * FROM promotion ORDER BY id DESC LIMIT 500", MAPPER);
        if (onlyCurrentlyValid == null) {
            return all;
        }
        return all.stream().filter(p -> p.currentlyValid() == onlyCurrentlyValid).toList();
    }

    public Optional<PromotionDtos.PromotionResponse> findById(long id) {
        return jdbcTemplate.query("SELECT * FROM promotion WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    public Optional<PromotionDtos.PromotionResponse> findByCode(String code) {
        return jdbcTemplate.query("SELECT * FROM promotion WHERE code = ?", MAPPER, code.trim().toUpperCase()).stream().findFirst();
    }

    public Optional<PromotionCalculator.Promo> findPromo(String code) {
        return findByCode(code).map(p -> new PromotionCalculator.Promo(p.code(), p.discountType(), p.discountValue(),
                p.minAmount(), p.startDate(), p.endDate(), p.usageLimit(), p.usedCount(), p.active()));
    }

    public long insert(PromotionDtos.PromotionRequest r) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO promotion (code, libelle, discount_type, discount_value, min_amount, start_date, end_date, usage_limit, active) "
                            + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
            bind(ps, r);
            return ps;
        }, keys);
        return Objects.requireNonNull(keys.getKey(), "Identifiant non genere par la base").longValue();
    }

    public int update(long id, PromotionDtos.PromotionRequest r) {
        return jdbcTemplate.update(
                "UPDATE promotion SET code = ?, libelle = ?, discount_type = ?, discount_value = ?, min_amount = ?, "
                        + "start_date = ?, end_date = ?, usage_limit = ?, active = ? WHERE id = ?",
                r.code().trim().toUpperCase(), r.label().trim(), r.discountType(), r.discountValue(),
                r.minAmount() == null ? java.math.BigDecimal.ZERO : r.minAmount(), Date.valueOf(r.startDate()),
                Date.valueOf(r.endDate()), r.usageLimit(), r.active() == null || r.active(), id);
    }

    public int delete(long id) {
        return jdbcTemplate.update("DELETE FROM promotion WHERE id = ?", id);
    }

    /** Atomic: increments the usage counter only while the limit is not reached. */
    public boolean consumeOne(String code) {
        return jdbcTemplate.update(
                "UPDATE promotion SET used_count = used_count + 1 WHERE code = ? AND (usage_limit IS NULL OR used_count < usage_limit)",
                code.trim().toUpperCase()) > 0;
    }

    private void bind(PreparedStatement ps, PromotionDtos.PromotionRequest r) throws java.sql.SQLException {
        ps.setString(1, r.code().trim().toUpperCase());
        ps.setString(2, r.label().trim());
        ps.setString(3, r.discountType());
        ps.setBigDecimal(4, r.discountValue());
        ps.setBigDecimal(5, r.minAmount() == null ? java.math.BigDecimal.ZERO : r.minAmount());
        ps.setDate(6, Date.valueOf(r.startDate()));
        ps.setDate(7, Date.valueOf(r.endDate()));
        if (r.usageLimit() == null) {
            ps.setNull(8, java.sql.Types.INTEGER);
        } else {
            ps.setInt(8, r.usageLimit());
        }
        ps.setBoolean(9, r.active() == null || r.active());
    }
}
