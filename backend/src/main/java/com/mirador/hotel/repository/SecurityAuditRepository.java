package com.mirador.hotel.repository;

import com.mirador.hotel.dto.IdentityDtos;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public class SecurityAuditRepository {

    private final JdbcTemplate jdbcTemplate;

    public SecurityAuditRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** In its own transaction: a refused operation (rolled back) must still leave its trace. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String actor, String action, String target, String details) {
        jdbcTemplate.update("INSERT INTO app_security_audit (actor, action, target, details) VALUES (?, ?, ?, ?)",
                actor, action, target, details == null ? null : details.substring(0, Math.min(details.length(), 500)));
    }

    public List<IdentityDtos.AuditEntry> latest(int limit) {
        return jdbcTemplate.query(
                "SELECT id, actor, action, target, details, created_at FROM app_security_audit ORDER BY id DESC LIMIT ?",
                (rs, i) -> new IdentityDtos.AuditEntry(rs.getLong("id"), rs.getString("actor"), rs.getString("action"),
                        rs.getString("target"), rs.getString("details"), rs.getTimestamp("created_at").toLocalDateTime()),
                limit);
    }
}
