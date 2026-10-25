package com.mirador.hotel.client;

import com.mirador.hotel.dto.NotificationDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.service.InvoiceService;
import com.mirador.hotel.service.NotificationService;
import com.mirador.hotel.util.DateTimeMapper;
import com.mirador.hotel.util.ValueUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * In-process counterpart of the microservices' {@code RemoteApi}. The promotions, avis, notifications, facturation and
 * paiements modules were written for the microservices, where this facade calls the other services over HTTP. In this
 * single-process deployment the same calls are answered directly: clients and reservations from the shared database,
 * invoices and notifications by the local services. Contracts (records and method names) are identical, so the
 * modules' code is unchanged.
 */
@Component
public class RemoteApi {

    private static final Logger log = LoggerFactory.getLogger(RemoteApi.class);

    // ------------------------------------------------------------------ contracts (same as the microservices)
    public record ClientInfo(Long id, String name, String clientType, String companyName, String email, String phone) { }
    public record ReservationInfo(long id, long clientId, String roomId, LocalDate checkIn, LocalDate checkOut,
                                  String status, BigDecimal totalAmount, String invoiceCode) { }
    public record InvoiceInfo(String code, Long clientId, BigDecimal total, BigDecimal net, BigDecimal totalPaid,
                              boolean paid, String status) { }
    public record PromotionResult(boolean valid, String code, BigDecimal discount, BigDecimal finalAmount, String reason) { }
    public record NotificationCommand(String channel, String recipient, String templateCode, String referenceKey,
                                      String subject, String body, Map<String, String> variables) { }

    // same queries as clients-service and reservations-service (InternalClientRepository, InternalReservationRepository)
    private static final String CLIENT_SELECT = "SELECT c.code_client, c.nom_client, c.type_client, c.contact, "
            + "p.email, p.company_name FROM client c LEFT JOIN app_client_profile p ON p.code_client = c.code_client";

    private static final RowMapper<ClientInfo> CLIENT_MAPPER = (rs, i) -> new ClientInfo(
            rs.getLong("code_client"),
            ValueUtils.coalesce(rs.getString("nom_client"), "Client"),
            ValueUtils.coalesce(rs.getString("type_client"), "Personne physique"),
            ValueUtils.trimToNull(rs.getString("company_name")),
            ValueUtils.trimToNull(rs.getString("email")),
            ValueUtils.trimToNull(rs.getString("contact")));

    private static final String NOT_CANCELLED =
            "COALESCE(ars.status_label, 'Confirmée') NOT IN ('Annulée', 'Annulee', 'Cancelled')";

    private static final String RESERVATION_SELECT = """
            SELECT o.code, o.code_client, o.code_chambre, DATE(o.date_debut) AS check_in, DATE(o.date_fin) AS check_out,
                   COALESCE(ars.status_label, 'Confirmée') AS status, COALESCE(ars.total_amount, 0) AS total_amount,
                   o.code_facture
            FROM occupation o
            LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
            """;

    private static final RowMapper<ReservationInfo> RESERVATION_MAPPER = (rs, i) -> new ReservationInfo(
            rs.getLong("code"),
            rs.getLong("code_client"),
            rs.getString("code_chambre"),
            DateTimeMapper.toLocalDate(rs.getDate("check_in")),
            DateTimeMapper.toLocalDate(rs.getDate("check_out")),
            rs.getString("status"),
            ValueUtils.bigDecimal(rs.getBigDecimal("total_amount")),
            ValueUtils.trimToNull(rs.getString("code_facture")));

    private final JdbcTemplate jdbcTemplate;
    // lazy: both services depend on this facade
    private final ObjectProvider<InvoiceService> invoices;
    private final ObjectProvider<NotificationService> notifications;

    public RemoteApi(JdbcTemplate jdbcTemplate, ObjectProvider<InvoiceService> invoices,
                     ObjectProvider<NotificationService> notifications) {
        this.jdbcTemplate = jdbcTemplate;
        this.invoices = invoices;
        this.notifications = notifications;
    }

    // ------------------------------------------------------------------ clients
    public Optional<ClientInfo> client(long id) {
        return jdbcTemplate.query(CLIENT_SELECT + " WHERE c.code_client = ?", CLIENT_MAPPER, id).stream().findFirst();
    }

    public Map<Long, ClientInfo> clients(Collection<Long> ids) {
        Map<Long, ClientInfo> result = new HashMap<>();
        if (ids.isEmpty()) {
            return result;
        }
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        jdbcTemplate.query(CLIENT_SELECT + " WHERE c.code_client IN (" + placeholders + ")", CLIENT_MAPPER, ids.toArray())
                .forEach(info -> result.put(info.id(), info));
        return result;
    }

    // ------------------------------------------------------------------ reservations
    public List<ReservationInfo> arrivals(LocalDate date) {
        return jdbcTemplate.query(RESERVATION_SELECT + " WHERE " + NOT_CANCELLED + " AND o.date_debut >= ? AND o.date_debut < ? ORDER BY o.code",
                RESERVATION_MAPPER, Timestamp.valueOf(date.atStartOfDay()), Timestamp.valueOf(date.plusDays(1).atStartOfDay()));
    }

    public Optional<ReservationInfo> reservation(long id) {
        return jdbcTemplate.query(RESERVATION_SELECT + " WHERE o.code = ?", RESERVATION_MAPPER, id).stream().findFirst();
    }

    public Optional<ReservationInfo> reservationByInvoice(String invoiceCode) {
        return jdbcTemplate.query(RESERVATION_SELECT + " WHERE o.code_facture = ? LIMIT 1", RESERVATION_MAPPER, invoiceCode)
                .stream().findFirst();
    }

    /** Sets the status of the reservation attached to an invoice and returns the previous status. */
    public String setReservationStatusByInvoice(String invoiceCode, String status) {
        Optional<ReservationInfo> current = reservationByInvoice(invoiceCode);
        if (current.isEmpty()) {
            return null;
        }
        jdbcTemplate.update("""
                INSERT INTO app_reservation_state (occupation_code, status_label, total_amount, created_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status_label = VALUES(status_label)
                """,
                current.get().id(), status, ValueUtils.bigDecimal(current.get().totalAmount()),
                Timestamp.valueOf(LocalDateTime.now()));
        return current.get().status();
    }

    // ------------------------------------------------------------------ invoices
    public Optional<InvoiceInfo> invoice(String code) {
        try {
            return Optional.ofNullable(invoices.getObject().info(code));
        } catch (ResourceNotFoundException ex) {
            return Optional.empty();
        }
    }

    public InvoiceInfo registerPayment(String code, BigDecimal amount, String reference) {
        return invoices.getObject().registerPayment(code, amount, reference);
    }

    public InvoiceInfo reversePayment(String code, BigDecimal amount, String reference) {
        return invoices.getObject().reversePayment(code, amount, reference);
    }

    // ------------------------------------------------------------------ notifications
    /** Best effort: a notification failure must never break the business operation that triggered it. */
    public void notifyQuietly(NotificationCommand command) {
        try {
            notifications.getObject().send(new NotificationDtos.SendRequest(command.channel(), command.recipient(),
                    command.templateCode(), command.referenceKey(), command.subject(), command.body(), command.variables()));
        } catch (RuntimeException ex) {
            log.warn("notification '{}' non envoyee : {}", command.templateCode(), ex.getMessage());
        }
    }
}
