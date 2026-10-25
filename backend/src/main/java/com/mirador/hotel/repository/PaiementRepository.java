package com.mirador.hotel.repository;

import java.util.Objects;
import com.mirador.hotel.dto.PaymentDtos;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Persistence of payments and of their saga execution log. */
@Repository
public class PaiementRepository {

    public record PaymentRow(Long id, String reference, String invoiceCode, Long clientId, BigDecimal amount,
                             String method, String status, String failureReason, LocalDateTime createdAt) {
    }

    private static final RowMapper<PaymentRow> PAYMENT_MAPPER = (rs, i) -> new PaymentRow(
            rs.getLong("id"), rs.getString("reference"), rs.getString("invoice_code"),
            rs.getObject("client_id") == null ? null : rs.getLong("client_id"),
            ValueUtils.bigDecimal(rs.getBigDecimal("amount")), rs.getString("method"), rs.getString("status"),
            rs.getString("failure_reason"), toLdt(rs.getTimestamp("created_at")));

    private final JdbcTemplate jdbcTemplate;

    public PaiementRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static LocalDateTime toLdt(Timestamp ts) {
        return ts == null ? null : ts.toLocalDateTime();
    }

    public long insertPayment(String reference, String invoiceCode, BigDecimal amount, String method) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO paiement (reference, invoice_code, amount, method, status) VALUES (?, ?, ?, ?, 'PENDING')",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, reference);
            ps.setString(2, invoiceCode);
            ps.setBigDecimal(3, amount);
            ps.setString(4, method);
            return ps;
        }, keys);
        return Objects.requireNonNull(keys.getKey(), "Identifiant non genere par la base").longValue();
    }

    public void finishPayment(long id, String status, String failureReason, Long clientId) {
        jdbcTemplate.update("UPDATE paiement SET status = ?, failure_reason = ?, client_id = ? WHERE id = ?",
                status, failureReason, clientId, id);
    }

    public Optional<PaymentRow> find(long id) {
        return jdbcTemplate.query("SELECT * FROM paiement WHERE id = ?", PAYMENT_MAPPER, id).stream().findFirst();
    }

    public List<PaymentRow> findAll(String invoiceCode, String status) {
        StringBuilder sql = new StringBuilder("SELECT * FROM paiement WHERE 1 = 1");
        List<Object> args = new ArrayList<>();
        if (invoiceCode != null && !invoiceCode.isBlank()) {
            sql.append(" AND invoice_code = ?");
            args.add(invoiceCode.trim());
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND status = ?");
            args.add(status.trim().toUpperCase());
        }
        sql.append(" ORDER BY id DESC LIMIT 500");
        return jdbcTemplate.query(sql.toString(), PAYMENT_MAPPER, args.toArray());
    }

    // ------------------------------------------------------------------ saga log
    public long insertSaga(long paymentId, String type) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO saga_execution (payment_id, saga_type, status) VALUES (?, ?, 'RUNNING')",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, paymentId);
            ps.setString(2, type);
            return ps;
        }, keys);
        return Objects.requireNonNull(keys.getKey(), "Identifiant non genere par la base").longValue();
    }

    public void endSaga(long sagaId, String status) {
        jdbcTemplate.update("UPDATE saga_execution SET status = ?, ended_at = NOW() WHERE id = ?", status, sagaId);
    }

    public void addStep(long sagaId, String step, String status, String detail) {
        jdbcTemplate.update("INSERT INTO saga_step (execution_id, step_name, status, detail) VALUES (?, ?, ?, ?)",
                sagaId, step, status, detail);
    }

    public Optional<PaymentDtos.SagaView> findSagaByPayment(long paymentId) {
        return jdbcTemplate.query(
                "SELECT id, saga_type, status, started_at, ended_at FROM saga_execution WHERE payment_id = ? ORDER BY id DESC LIMIT 1",
                (rs, i) -> new PaymentDtos.SagaView(rs.getLong("id"), rs.getString("saga_type"), rs.getString("status"),
                        toLdt(rs.getTimestamp("started_at")), toLdt(rs.getTimestamp("ended_at")), List.of()),
                paymentId).stream().findFirst()
                .map(saga -> new PaymentDtos.SagaView(saga.id(), saga.type(), saga.status(), saga.startedAt(), saga.endedAt(),
                        steps(saga.id())));
    }

    private List<PaymentDtos.StepView> steps(long sagaId) {
        return jdbcTemplate.query(
                "SELECT step_name, status, detail, created_at FROM saga_step WHERE execution_id = ? ORDER BY id",
                (rs, i) -> new PaymentDtos.StepView(rs.getString("step_name"), rs.getString("status"),
                        rs.getString("detail"), toLdt(rs.getTimestamp("created_at"))),
                sagaId);
    }
}
