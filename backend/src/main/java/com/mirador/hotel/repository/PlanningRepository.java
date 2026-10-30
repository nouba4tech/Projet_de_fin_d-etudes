package com.mirador.hotel.repository;

import java.util.Objects;
import com.mirador.hotel.dto.PlanningDtos;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Time;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class PlanningRepository {

    private static final String SELECT = """
            SELECT p.id, p.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
                   p.shift_date, p.start_time, p.end_time, p.post_name, p.notes
            FROM app_employee_planning p
            JOIN app_employee e ON e.id = p.employee_id
            """;

    private static final RowMapper<PlanningDtos.ShiftResponse> MAPPER = (rs, i) -> {
        LocalTime start = rs.getTime("start_time").toLocalTime();
        LocalTime end = rs.getTime("end_time").toLocalTime();
        return new PlanningDtos.ShiftResponse(rs.getLong("id"), rs.getLong("employee_id"), rs.getString("employee_name"),
                rs.getDate("shift_date").toLocalDate(), start, end,
                Duration.between(start, end).toMinutes() / 60.0, rs.getString("post_name"), rs.getString("notes"));
    };

    private final JdbcTemplate jdbcTemplate;

    public PlanningRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean employeeExists(long employeeId) {
        Long n = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM app_employee WHERE id = ?", Long.class, employeeId);
        return n != null && n > 0;
    }

    public List<PlanningDtos.ShiftResponse> find(Long employeeId, LocalDate from, LocalDate to) {
        StringBuilder sql = new StringBuilder(SELECT).append(" WHERE p.shift_date BETWEEN ? AND ?");
        List<Object> args = new ArrayList<>(List.of(Date.valueOf(from), Date.valueOf(to)));
        if (employeeId != null) {
            sql.append(" AND p.employee_id = ?");
            args.add(employeeId);
        }
        sql.append(" ORDER BY p.shift_date, p.start_time, p.id");
        return jdbcTemplate.query(sql.toString(), MAPPER, args.toArray());
    }

    public Optional<PlanningDtos.ShiftResponse> findById(long id) {
        return jdbcTemplate.query(SELECT + " WHERE p.id = ?", MAPPER, id).stream().findFirst();
    }

    /** Shifts of the same employee on the same day that overlap [start, end), ignoring {@code excludeId}. */
    public long countOverlaps(long employeeId, LocalDate date, LocalTime start, LocalTime end, Long excludeId) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_employee_planning WHERE employee_id = ? AND shift_date = ? "
                        + "AND start_time < ? AND end_time > ? AND (? IS NULL OR id <> ?)",
                Long.class, employeeId, Date.valueOf(date), Time.valueOf(end), Time.valueOf(start), excludeId, excludeId);
        return n == null ? 0 : n;
    }

    public long insert(long employeeId, PlanningDtos.ShiftRequest request) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO app_employee_planning (employee_id, shift_date, start_time, end_time, post_name, notes) "
                            + "VALUES (?, ?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, employeeId);
            ps.setDate(2, Date.valueOf(request.date()));
            ps.setTime(3, Time.valueOf(request.startTime()));
            ps.setTime(4, Time.valueOf(request.endTime()));
            ps.setString(5, request.post().trim());
            ps.setString(6, request.notes());
            return ps;
        }, keys);
        return Objects.requireNonNull(keys.getKey(), "Identifiant non genere par la base").longValue();
    }

    public int update(long id, PlanningDtos.ShiftRequest request) {
        return jdbcTemplate.update(
                "UPDATE app_employee_planning SET shift_date = ?, start_time = ?, end_time = ?, post_name = ?, notes = ? WHERE id = ?",
                Date.valueOf(request.date()), Time.valueOf(request.startTime()), Time.valueOf(request.endTime()),
                request.post().trim(), request.notes(), id);
    }

    public int delete(long id) {
        return jdbcTemplate.update("DELETE FROM app_employee_planning WHERE id = ?", id);
    }

    public void deleteForEmployee(long employeeId) {
        jdbcTemplate.update("DELETE FROM app_employee_planning WHERE employee_id = ?", employeeId);
    }
}
