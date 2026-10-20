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
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class FinanceRepository {

    private final JdbcTemplate jdbcTemplate;

    public FinanceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OperationsDtos.FinanceTransactionResponse> findAll() {
        return jdbcTemplate.query("""
                SELECT id, transaction_type, category_name, description_text, amount_value, transaction_date, reference_code, created_at
                FROM app_finance_transaction
                ORDER BY transaction_date DESC, id DESC
                """, (rs, rowNum) -> new OperationsDtos.FinanceTransactionResponse(
                rs.getLong("id"),
                rs.getString("transaction_type"),
                rs.getString("category_name"),
                rs.getString("description_text"),
                ValueUtils.bigDecimal(rs.getBigDecimal("amount_value")),
                DateTimeMapper.toLocalDate(rs.getDate("transaction_date")),
                ValueUtils.trimToNull(rs.getString("reference_code")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at"))));
    }

    public Optional<OperationsDtos.FinanceTransactionResponse> findById(long transactionId) {
        return jdbcTemplate.query("""
                SELECT id, transaction_type, category_name, description_text, amount_value, transaction_date, reference_code, created_at
                FROM app_finance_transaction
                WHERE id = ?
                """, (rs, rowNum) -> new OperationsDtos.FinanceTransactionResponse(
                rs.getLong("id"),
                rs.getString("transaction_type"),
                rs.getString("category_name"),
                rs.getString("description_text"),
                ValueUtils.bigDecimal(rs.getBigDecimal("amount_value")),
                DateTimeMapper.toLocalDate(rs.getDate("transaction_date")),
                ValueUtils.trimToNull(rs.getString("reference_code")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at"))), transactionId).stream().findFirst();
    }

    public long create(OperationsDtos.FinanceTransactionRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_finance_transaction (
                        transaction_type, category_name, description_text, amount_value, transaction_date, reference_code, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.type().trim());
            statement.setString(2, request.category().trim());
            statement.setString(3, request.description().trim());
            statement.setBigDecimal(4, ValueUtils.bigDecimal(request.amount()));
            statement.setDate(5, java.sql.Date.valueOf(request.transactionDate()));
            statement.setString(6, ValueUtils.trimToNull(request.reference()));
            statement.setTimestamp(7, Timestamp.valueOf(LocalDateTime.now()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant de la transaction.");
        }
        return key.longValue();
    }

    public void update(long transactionId, OperationsDtos.FinanceTransactionRequest request) {
        jdbcTemplate.update("""
                UPDATE app_finance_transaction
                SET transaction_type = ?, category_name = ?, description_text = ?, amount_value = ?,
                    transaction_date = ?, reference_code = ?
                WHERE id = ?
                """,
                request.type().trim(),
                request.category().trim(),
                request.description().trim(),
                ValueUtils.bigDecimal(request.amount()),
                java.sql.Date.valueOf(request.transactionDate()),
                ValueUtils.trimToNull(request.reference()),
                transactionId);
    }

    public void delete(long transactionId) {
        jdbcTemplate.update("DELETE FROM app_finance_transaction WHERE id = ?", transactionId);
    }
}
