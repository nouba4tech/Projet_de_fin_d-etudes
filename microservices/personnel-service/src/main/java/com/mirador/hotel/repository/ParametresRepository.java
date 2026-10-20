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

    // ===== PERSONNEL =====

    public List<ParametresDtos.PersonnelResponse> findAllPersonnel(String status) {
        String sql = "SELECT id, first_name, last_name, email, phone, position_name, department_name, hire_date, salary_amount, status_label, role_name FROM app_employee";
        if (status != null) sql += " WHERE status_label = ?";
        sql += " ORDER BY id DESC";

        if (status != null) {
            return jdbcTemplate.query(sql, (rs, rowNum) -> mapPersonnel(rs), status);
        }
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapPersonnel(rs));
    }

    private ParametresDtos.PersonnelResponse mapPersonnel(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new ParametresDtos.PersonnelResponse(
                String.valueOf(rs.getLong("id")),
                "EMP-" + rs.getLong("id"),
                ValueUtils.coalesce(rs.getString("first_name"), ""),
                ValueUtils.coalesce(rs.getString("last_name"), ""),
                ValueUtils.trimToNull(rs.getString("email")),
                ValueUtils.trimToNull(rs.getString("phone")),
                ValueUtils.coalesce(rs.getString("position_name"), ""),
                ValueUtils.coalesce(rs.getString("department_name"), ""),
                rs.getDate("hire_date") != null ? rs.getDate("hire_date").toLocalDate() : null,
                ValueUtils.bigDecimal(rs.getBigDecimal("salary_amount")),
                ValueUtils.coalesce(rs.getString("status_label"), "Actif"),
                List.of(), null, null
        );
    }

    public Optional<ParametresDtos.PersonnelResponse> findPersonnelById(String id) {
        long empId;
        try { empId = Long.parseLong(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("""
                SELECT id, first_name, last_name, email, phone, position_name, department_name, hire_date, salary_amount, status_label, role_name
                FROM app_employee WHERE id = ?
                """, (rs, rowNum) -> mapPersonnel(rs), empId).stream().findFirst();
    }

    public long createPersonnel(ParametresDtos.PersonnelRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO app_employee (first_name, last_name, email, phone, position_name, department_name, hire_date, salary_amount, status_label, role_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, request.firstName().trim());
            ps.setString(2, request.lastName().trim());
            ps.setString(3, ValueUtils.trimToNull(request.email()));
            ps.setString(4, ValueUtils.trimToNull(request.phone()));
            ps.setString(5, request.position().trim());
            ps.setString(6, ValueUtils.coalesce(request.department(), "General"));
            ps.setDate(7, request.hireDate() != null ? java.sql.Date.valueOf(request.hireDate()) : java.sql.Date.valueOf(java.time.LocalDate.now()));
            ps.setBigDecimal(8, request.salary() != null ? request.salary() : BigDecimal.ZERO);
            ps.setString(9, ValueUtils.coalesce(request.status(), "Actif"));
            ps.setString(10, "Service");
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant de l'employe.");
        return key.longValue();
    }

    public void updatePersonnel(String id, ParametresDtos.PersonnelRequest request) {
        long empId;
        try { empId = Long.parseLong(id); } catch (NumberFormatException e) { return; }

        jdbcTemplate.update("""
                UPDATE app_employee SET first_name = ?, last_name = ?, email = ?, phone = ?, position_name = ?,
                    department_name = ?, hire_date = ?, salary_amount = ?, status_label = ?
                WHERE id = ?
                """,
                request.firstName().trim(), request.lastName().trim(),
                ValueUtils.trimToNull(request.email()), ValueUtils.trimToNull(request.phone()),
                request.position().trim(), ValueUtils.coalesce(request.department(), "General"),
                request.hireDate() != null ? java.sql.Date.valueOf(request.hireDate()) : null,
                request.salary() != null ? request.salary() : BigDecimal.ZERO,
                ValueUtils.coalesce(request.status(), "Actif"),
                empId);
    }

    public void deletePersonnel(String id) {
        long empId;
        try { empId = Long.parseLong(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM app_employee WHERE id = ?", empId);
    }
}
