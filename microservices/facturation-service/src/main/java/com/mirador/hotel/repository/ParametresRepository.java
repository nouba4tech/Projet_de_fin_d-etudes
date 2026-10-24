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
import java.util.List;
import java.util.Optional;

@Repository
public class ParametresRepository {

    private final JdbcTemplate jdbcTemplate;

    public ParametresRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ===== CASH REGISTERS =====

    public List<ParametresDtos.CashRegisterResponse> findAllCashRegisters(String status) {
        String sql = "SELECT code_caisse, numero, libelle FROM caisse ORDER BY code_caisse";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new ParametresDtos.CashRegisterResponse(
                String.valueOf(rs.getInt("code_caisse")),
                ValueUtils.coalesce(rs.getString("numero"), ""),
                ValueUtils.coalesce(rs.getString("libelle"), ""),
                null, BigDecimal.ZERO, BigDecimal.ZERO, "XAF", "active", null, null, null
        ));
    }

    public Optional<ParametresDtos.CashRegisterResponse> findCashRegisterById(String id) {
        int cashId;
        try { cashId = Integer.parseInt(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("SELECT code_caisse, numero, libelle FROM caisse WHERE code_caisse = ?",
                (rs, rowNum) -> new ParametresDtos.CashRegisterResponse(
                        String.valueOf(rs.getInt("code_caisse")),
                        ValueUtils.coalesce(rs.getString("numero"), ""),
                        ValueUtils.coalesce(rs.getString("libelle"), ""),
                        null, BigDecimal.ZERO, BigDecimal.ZERO, "XAF", "active", null, null, null
                ), cashId).stream().findFirst();
    }

    public int createCashRegister(ParametresDtos.CashRegisterRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO caisse (numero, libelle) VALUES (?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, ValueUtils.trimToNull(request.code()));
            ps.setString(2, ValueUtils.trimToNull(request.name()));
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant de la caisse.");
        return key.intValue();
    }

    public void updateCashRegister(String id, ParametresDtos.CashRegisterRequest request) {
        int cashId;
        try { cashId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("UPDATE caisse SET numero = ?, libelle = ? WHERE code_caisse = ?",
                ValueUtils.trimToNull(request.code()), ValueUtils.trimToNull(request.name()), cashId);
    }

    public void deleteCashRegister(String id) {
        int cashId;
        try { cashId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM caisse WHERE code_caisse = ?", cashId);
    }
}
