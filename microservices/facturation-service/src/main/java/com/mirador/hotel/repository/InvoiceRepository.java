package com.mirador.hotel.repository;

import com.mirador.hotel.dto.InvoiceDtos;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Invoices (facture / detail_facture) plus their status metadata and audit trail. */
@Repository
public class InvoiceRepository {

    public static final String EMISE = "EMISE";
    public static final String PARTIELLEMENT_PAYEE = "PARTIELLEMENT_PAYEE";
    public static final String PAYEE = "PAYEE";
    public static final String ARCHIVEE = "ARCHIVEE";
    public static final String ANNULEE = "ANNULEE";

    /** Raw invoice row. */
    public record InvoiceRow(String code, Long clientId, LocalDateTime date, BigDecimal total, BigDecimal discount,
                             BigDecimal net, BigDecimal totalPaid, String metaStatus,
                             LocalDateTime archivedAt, String archivedBy) {

        public String status() {
            if (ARCHIVEE.equals(metaStatus) || ANNULEE.equals(metaStatus)) {
                return metaStatus;
            }
            if (net.signum() > 0 && totalPaid.compareTo(net) >= 0) {
                return PAYEE;
            }
            return totalPaid.signum() > 0 ? PARTIELLEMENT_PAYEE : EMISE;
        }

        public BigDecimal remaining() {
            return net.subtract(totalPaid).max(BigDecimal.ZERO);
        }

        public boolean paid() {
            return PAYEE.equals(status()) || (ARCHIVEE.equals(status()) && totalPaid.compareTo(net) >= 0);
        }
    }

    public record DetailLine(String service, String label, int quantity, BigDecimal unitPrice, BigDecimal total) {
    }

    private static final String SELECT = """
            SELECT f.code_facture, f.code_client, f.date_facture,
                   COALESCE(f.remise, 0) AS remise, COALESCE(f.total, 0) AS total, COALESCE(f.net, 0) AS net,
                   COALESCE(f.total_paye, 0) AS total_paye,
                   m.statut, m.archived_at, m.archived_by
            FROM facture f
            LEFT JOIN app_invoice_meta m ON m.code_facture = f.code_facture
            """;

    private static final RowMapper<InvoiceRow> MAPPER = (rs, i) -> new InvoiceRow(
            rs.getString("code_facture"),
            rs.getObject("code_client") == null ? null : rs.getLong("code_client"),
            toLdt(rs.getTimestamp("date_facture")),
            ValueUtils.bigDecimal(rs.getBigDecimal("total")),
            ValueUtils.bigDecimal(rs.getBigDecimal("remise")),
            ValueUtils.bigDecimal(rs.getBigDecimal("net")),
            ValueUtils.bigDecimal(rs.getBigDecimal("total_paye")),
            rs.getString("statut"),
            toLdt(rs.getTimestamp("archived_at")),
            rs.getString("archived_by"));

    private final JdbcTemplate jdbcTemplate;

    public InvoiceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static LocalDateTime toLdt(Timestamp ts) {
        return ts == null ? null : ts.toLocalDateTime();
    }

    // ------------------------------------------------------------------ reads
    public Optional<InvoiceRow> find(String code) {
        return jdbcTemplate.query(SELECT + " WHERE f.code_facture = ?", MAPPER, code).stream().findFirst();
    }

    /** Same as {@link #find} but takes a row lock; must be called inside a transaction. */
    public Optional<InvoiceRow> findForUpdate(String code) {
        return jdbcTemplate.query(SELECT + " WHERE f.code_facture = ? FOR UPDATE", MAPPER, code).stream().findFirst();
    }

    public List<InvoiceRow> findAll(Long clientId) {
        StringBuilder sql = new StringBuilder(SELECT);
        List<Object> args = new ArrayList<>();
        if (clientId != null) {
            sql.append(" WHERE f.code_client = ?");
            args.add(clientId);
        }
        sql.append(" ORDER BY f.date_facture DESC, f.code_facture DESC");
        return jdbcTemplate.query(sql.toString(), MAPPER, args.toArray());
    }

    public List<DetailLine> detailLines(String code) {
        return jdbcTemplate.query(
                "SELECT service, libelle, COALESCE(qte, 1) AS qte, COALESCE(pu, 0) AS pu, COALESCE(total, 0) AS total "
                        + "FROM detail_facture WHERE code_facture = ? ORDER BY code_detail",
                (rs, i) -> new DetailLine(rs.getString("service"), rs.getString("libelle"), rs.getInt("qte"),
                        ValueUtils.bigDecimal(rs.getBigDecimal("pu")), ValueUtils.bigDecimal(rs.getBigDecimal("total"))),
                code);
    }

    public List<InvoiceDtos.InvoiceEvent> events(String code) {
        return jdbcTemplate.query(
                "SELECT event_type, detail, created_at FROM app_invoice_event WHERE code_facture = ? ORDER BY id",
                (rs, i) -> new InvoiceDtos.InvoiceEvent(rs.getString("event_type"), rs.getString("detail"),
                        toLdt(rs.getTimestamp("created_at"))),
                code);
    }

    public boolean eventExists(String code, String type, String reference) {
        Long n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_invoice_event WHERE code_facture = ? AND event_type = ? AND detail LIKE ?",
                Long.class, code, type, "ref=" + reference + ";%");
        return n != null && n > 0;
    }

    public BigDecimal revenueToday() {
        BigDecimal value = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(net), 0) FROM facture WHERE DATE(date_facture) = CURRENT_DATE()", BigDecimal.class);
        return ValueUtils.bigDecimal(value);
    }

    public Map<String, BigDecimal> revenueByDay(LocalDate from, LocalDate to) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        jdbcTemplate.query(
                "SELECT DATE(date_facture) AS day, COALESCE(SUM(net), 0) AS total FROM facture "
                        + "WHERE DATE(date_facture) BETWEEN ? AND ? GROUP BY DATE(date_facture)",
                rs -> {
                    result.put(rs.getDate("day").toLocalDate().toString(), rs.getBigDecimal("total"));
                },
                java.sql.Date.valueOf(from), java.sql.Date.valueOf(to));
        return result;
    }

    // ------------------------------------------------------------------ writes
    public String create(Long clientId, BigDecimal amount) {
        String code = "RS" + System.currentTimeMillis();
        jdbcTemplate.update("""
                INSERT INTO facture (code_facture, code_client, date_facture, remise, total, net, code_depot, total_paye, paye)
                VALUES (?, ?, ?, 0, ?, ?, 1, 0, 0)
                """, code, clientId, Timestamp.valueOf(LocalDateTime.now()), amount, amount);
        jdbcTemplate.update("INSERT INTO app_invoice_meta (code_facture, statut) VALUES (?, ?)", code, EMISE);
        addEvent(code, "CREATED", "montant=" + amount);
        return code;
    }

    public int update(String code, Long clientId, BigDecimal amount) {
        int rows = jdbcTemplate.update(
                "UPDATE facture SET code_client = ?, total = ?, net = ?, date_facture = ? WHERE code_facture = ?",
                clientId, amount, amount, Timestamp.valueOf(LocalDateTime.now()), code);
        if (rows > 0) {
            addEvent(code, "UPDATED", "montant=" + amount);
        }
        return rows;
    }

    public void delete(String code) {
        jdbcTemplate.update("DELETE FROM detail_facture WHERE code_facture = ?", code);
        jdbcTemplate.update("DELETE FROM app_invoice_event WHERE code_facture = ?", code);
        jdbcTemplate.update("DELETE FROM app_invoice_meta WHERE code_facture = ?", code);
        jdbcTemplate.update("DELETE FROM facture WHERE code_facture = ?", code);
    }

    public void updatePaid(String code, BigDecimal totalPaid, boolean fullyPaid) {
        jdbcTemplate.update("UPDATE facture SET total_paye = ?, paye = ? WHERE code_facture = ?",
                totalPaid, fullyPaid ? 1 : 0, code);
    }

    public void archive(String code, String user) {
        jdbcTemplate.update("""
                INSERT INTO app_invoice_meta (code_facture, statut, archived_at, archived_by)
                VALUES (?, ?, NOW(), ?)
                ON DUPLICATE KEY UPDATE statut = VALUES(statut), archived_at = VALUES(archived_at),
                                        archived_by = VALUES(archived_by)
                """, code, ARCHIVEE, user);
    }

    public void addEvent(String code, String type, String detail) {
        jdbcTemplate.update("INSERT INTO app_invoice_event (code_facture, event_type, detail) VALUES (?, ?, ?)",
                code, type, detail);
    }
}
