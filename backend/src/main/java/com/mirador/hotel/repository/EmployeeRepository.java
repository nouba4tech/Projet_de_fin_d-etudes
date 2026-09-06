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
import java.util.List;
import java.util.Optional;

@Repository
public class EmployeeRepository {

    private final JdbcTemplate jdbcTemplate;

    public EmployeeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OperationsDtos.EmployeeResponse> findAll() {
        return jdbcTemplate.query("""
                SELECT id, code_user, first_name, last_name, email, phone, position_name, department_name,
                       hire_date, salary_amount, status_label, role_name
                FROM app_employee
                ORDER BY id DESC
                """, (rs, rowNum) -> new OperationsDtos.EmployeeResponse(
                rs.getLong("id"),
                rs.getString("first_name"),
                rs.getString("last_name"),
                ValueUtils.trimToNull(rs.getString("email")),
                ValueUtils.trimToNull(rs.getString("phone")),
                rs.getString("position_name"),
                rs.getString("department_name"),
                DateTimeMapper.toLocalDate(rs.getDate("hire_date")),
                ValueUtils.bigDecimal(rs.getBigDecimal("salary_amount")),
                rs.getString("status_label"),
                rs.getString("role_name"),
                ValueUtils.longValue(rs, "code_user")));
    }

    public Optional<OperationsDtos.EmployeeResponse> findById(long employeeId) {
        return jdbcTemplate.query("""
                SELECT id, code_user, first_name, last_name, email, phone, position_name, department_name,
                       hire_date, salary_amount, status_label, role_name
                FROM app_employee
                WHERE id = ?
                """, (rs, rowNum) -> new OperationsDtos.EmployeeResponse(
                rs.getLong("id"),
                rs.getString("first_name"),
                rs.getString("last_name"),
                ValueUtils.trimToNull(rs.getString("email")),
                ValueUtils.trimToNull(rs.getString("phone")),
                rs.getString("position_name"),
                rs.getString("department_name"),
                DateTimeMapper.toLocalDate(rs.getDate("hire_date")),
                ValueUtils.bigDecimal(rs.getBigDecimal("salary_amount")),
                rs.getString("status_label"),
                rs.getString("role_name"),
                ValueUtils.longValue(rs, "code_user")), employeeId).stream().findFirst();
    }

    public long create(OperationsDtos.EmployeeRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_employee (
                        code_user, first_name, last_name, email, phone, position_name, department_name,
                        hire_date, salary_amount, status_label, role_name
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setObject(1, request.userId());
            statement.setString(2, request.firstName().trim());
            statement.setString(3, request.lastName().trim());
            statement.setString(4, ValueUtils.trimToNull(request.email()));
            statement.setString(5, ValueUtils.trimToNull(request.phone()));
            statement.setString(6, request.position().trim());
            statement.setString(7, request.department().trim());
            statement.setDate(8, java.sql.Date.valueOf(request.hireDate()));
            statement.setBigDecimal(9, ValueUtils.bigDecimal(request.salary()));
            statement.setString(10, ValueUtils.coalesce(request.status(), "Actif"));
            statement.setString(11, ValueUtils.coalesce(request.userRole(), "Service"));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant employe.");
        }
        return key.longValue();
    }

    public void update(long employeeId, OperationsDtos.EmployeeRequest request) {
        jdbcTemplate.update("""
                UPDATE app_employee
                SET code_user = ?, first_name = ?, last_name = ?, email = ?, phone = ?, position_name = ?,
                    department_name = ?, hire_date = ?, salary_amount = ?, status_label = ?, role_name = ?
                WHERE id = ?
                """,
                request.userId(),
                request.firstName().trim(),
                request.lastName().trim(),
                ValueUtils.trimToNull(request.email()),
                ValueUtils.trimToNull(request.phone()),
                request.position().trim(),
                request.department().trim(),
                java.sql.Date.valueOf(request.hireDate()),
                ValueUtils.bigDecimal(request.salary()),
                ValueUtils.coalesce(request.status(), "Actif"),
                ValueUtils.coalesce(request.userRole(), "Service"),
                employeeId);
    }

    public void delete(long employeeId) {
        jdbcTemplate.update("DELETE FROM app_employee WHERE id = ?", employeeId);
    }
}
