package com.mirador.hotel.client;

import com.mirador.hotel.exception.RemoteServiceException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;

/**
 * Typed facade over the {@code /internal/**} APIs of the other microservices. Every microservice can inject it
 * and use only the calls it needs. Methods named {@code ...OrDefault} never throw: they degrade gracefully
 * (used for read-only enrichment such as dashboards).
 */
@Component
public class RemoteApi {

    private static final Logger log = LoggerFactory.getLogger(RemoteApi.class);

    // ------------------------------------------------------------------ contracts
    public record RoomInfo(String code, String typeLabel, BigDecimal nightlyRate) { }
    public record RoomsSummary(long total, long cleaning) { }
    public record ClientInfo(Long id, String name, String clientType, String companyName, String email, String phone) { }
    public record ClientStat(long totalStays, LocalDate lastStay) { }
    public record ReservationStats(long occupiedRooms, long pendingCheckins, long activeReservations) { }
    public record ReservationInfo(long id, long clientId, String roomId, LocalDate checkIn, LocalDate checkOut,
                                  String status, BigDecimal totalAmount, String invoiceCode) { }
    public record InvoiceInfo(String code, Long clientId, BigDecimal total, BigDecimal net, BigDecimal totalPaid,
                              boolean paid, String status) { }
    public record PromotionResult(boolean valid, String code, BigDecimal discount, BigDecimal finalAmount, String reason) { }
    public record NotificationCommand(String channel, String recipient, String templateCode, String referenceKey,
                                      String subject, String body, Map<String, String> variables) { }

    private record AmountBody(Long clientId, BigDecimal amount) { }
    private record PaymentBody(BigDecimal amount, String reference) { }
    private record StatusBody(String status) { }
    private record NameBody(String displayName) { }
    private record PromoBody(String code, BigDecimal amount) { }

    private final InternalApiClient http;
    private final String chambres;
    private final String clients;
    private final String reservations;
    private final String facturation;
    private final String paiements;
    private final String promotions;
    private final String notifications;

    public RemoteApi(InternalApiClient http,
                     @Value("${services.chambres.url}") String chambres,
                     @Value("${services.clients.url}") String clients,
                     @Value("${services.reservations.url}") String reservations,
                     @Value("${services.facturation.url}") String facturation,
                     @Value("${services.paiements.url}") String paiements,
                     @Value("${services.promotions.url}") String promotions,
                     @Value("${services.notifications.url}") String notifications) {
        this.http = http;
        this.chambres = chambres;
        this.clients = clients;
        this.reservations = reservations;
        this.facturation = facturation;
        this.paiements = paiements;
        this.promotions = promotions;
        this.notifications = notifications;
    }

    // ------------------------------------------------------------------ chambres-service
    public Optional<RoomInfo> room(String code) {
        return optional(() -> http.get(chambres, "/internal/rooms/" + code.trim(), RoomInfo.class));
    }

    public Map<String, String> roomTypes(Collection<String> codes) {
        if (codes.isEmpty()) {
            return Map.of();
        }
        return http.post(chambres, "/internal/rooms/types", List.copyOf(codes),
                new ParameterizedTypeReference<Map<String, String>>() { });
    }

    public RoomsSummary roomsSummaryOrDefault() {
        return orDefault("chambres-service",
                () -> http.get(chambres, "/internal/rooms/summary", RoomsSummary.class), new RoomsSummary(0, 0));
    }

    // ------------------------------------------------------------------ clients-service
    public Optional<ClientInfo> client(long id) {
        return optional(() -> http.get(clients, "/internal/clients/" + id, ClientInfo.class));
    }

    public Map<Long, ClientInfo> clients(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<String, ClientInfo> raw = http.post(clients, "/internal/clients/lookup", List.copyOf(ids),
                new ParameterizedTypeReference<Map<String, ClientInfo>>() { });
        Map<Long, ClientInfo> result = new HashMap<>();
        raw.forEach((key, value) -> result.put(Long.valueOf(key), value));
        return result;
    }

    public long clientsCountOrDefault() {
        return orDefault("clients-service", () -> http.get(clients, "/internal/clients/count", Long.class), 0L);
    }

    // ------------------------------------------------------------------ reservations-service
    public Set<String> occupiedRoomsTodayOrDefault() {
        return orDefault("reservations-service",
                () -> Set.copyOf(http.get(reservations, "/internal/reservations/occupied-rooms",
                        new ParameterizedTypeReference<List<String>>() { })),
                Set.of());
    }

    public long reservationsForRoom(String roomCode) {
        Long count = http.get(reservations, "/internal/reservations/count-by-room/" + roomCode.trim(), Long.class);
        return count == null ? 0 : count;
    }

    public long reservationsForClient(long clientId) {
        Long count = http.get(reservations, "/internal/reservations/count-by-client/" + clientId, Long.class);
        return count == null ? 0 : count;
    }

    public Map<Long, ClientStat> clientStatsOrDefault() {
        return orDefault("reservations-service", () -> {
            Map<String, ClientStat> raw = http.get(reservations, "/internal/reservations/client-stats",
                    new ParameterizedTypeReference<Map<String, ClientStat>>() { });
            Map<Long, ClientStat> result = new HashMap<>();
            raw.forEach((key, value) -> result.put(Long.valueOf(key), value));
            return result;
        }, Map.of());
    }

    public ReservationStats reservationStatsOrDefault() {
        return orDefault("reservations-service",
                () -> http.get(reservations, "/internal/reservations/stats/today", ReservationStats.class),
                new ReservationStats(0, 0, 0));
    }

    public Map<String, Long> occupancyByDayOrDefault(LocalDate from, LocalDate to) {
        return orDefault("reservations-service",
                () -> http.get(reservations, "/internal/reservations/stats/occupancy?from=" + from + "&to=" + to,
                        new ParameterizedTypeReference<Map<String, Long>>() { }),
                Map.of());
    }

    public List<ReservationInfo> arrivals(LocalDate date) {
        return http.get(reservations, "/internal/reservations/arrivals?date=" + date,
                new ParameterizedTypeReference<List<ReservationInfo>>() { });
    }

    public Optional<ReservationInfo> reservation(long id) {
        return optional(() -> http.get(reservations, "/internal/reservations/" + id, ReservationInfo.class));
    }

    public Optional<ReservationInfo> reservationByInvoice(String invoiceCode) {
        return optional(() -> http.get(reservations, "/internal/reservations/by-invoice/" + invoiceCode,
                ReservationInfo.class));
    }

    /** Sets the status of the reservation attached to an invoice and returns the previous status. */
    @SuppressWarnings("unchecked")
    public String setReservationStatusByInvoice(String invoiceCode, String status) {
        Map<String, Object> body = http.post(reservations,
                "/internal/reservations/by-invoice/" + invoiceCode + "/status", new StatusBody(status), Map.class);
        return body == null ? null : (String) body.get("previousStatus");
    }

    // ------------------------------------------------------------------ facturation-service
    @SuppressWarnings("unchecked")
    public String createInvoice(long clientId, BigDecimal amount) {
        Map<String, Object> body = http.post(facturation, "/internal/invoices", new AmountBody(clientId, amount), Map.class);
        return String.valueOf(body.get("code"));
    }

    public void updateInvoice(String code, long clientId, BigDecimal amount) {
        http.put(facturation, "/internal/invoices/" + code, new AmountBody(clientId, amount));
    }

    public void deleteInvoice(String code) {
        http.delete(facturation, "/internal/invoices/" + code);
    }

    public Optional<InvoiceInfo> invoice(String code) {
        return optional(() -> http.get(facturation, "/internal/invoices/" + code, InvoiceInfo.class));
    }

    public InvoiceInfo registerPayment(String code, BigDecimal amount, String reference) {
        return http.post(facturation, "/internal/invoices/" + code + "/payments",
                new PaymentBody(amount, reference), InvoiceInfo.class);
    }

    public InvoiceInfo reversePayment(String code, BigDecimal amount, String reference) {
        return http.post(facturation, "/internal/invoices/" + code + "/payments/reverse",
                new PaymentBody(amount, reference), InvoiceInfo.class);
    }

    public BigDecimal invoiceRevenueTodayOrDefault() {
        return orDefault("facturation-service",
                () -> http.get(facturation, "/internal/invoices/revenue-today", BigDecimal.class), BigDecimal.ZERO);
    }

    public Map<String, BigDecimal> invoiceRevenueByDayOrDefault(LocalDate from, LocalDate to) {
        return orDefault("facturation-service",
                () -> http.get(facturation, "/internal/invoices/revenue-by-day?from=" + from + "&to=" + to,
                        new ParameterizedTypeReference<Map<String, BigDecimal>>() { }),
                Map.of());
    }

    @SuppressWarnings("unchecked")
    public String createClientAccount(String displayName) {
        Map<String, Object> body = http.post(facturation, "/internal/client-accounts", new NameBody(displayName), Map.class);
        return String.valueOf(body.get("numcompte"));
    }

    public void renameClientAccount(String accountNumber, String displayName) {
        http.put(facturation, "/internal/client-accounts/" + accountNumber, new NameBody(displayName));
    }

    // ------------------------------------------------------------------ paiements-service
    public void createFinanceTransaction(Object transactionRequest) {
        http.post(paiements, "/internal/finance/transactions", transactionRequest, Void.class);
    }

    public BigDecimal financeRevenueTodayOrDefault() {
        return orDefault("paiements-service",
                () -> http.get(paiements, "/internal/finance/revenue-today", BigDecimal.class), BigDecimal.ZERO);
    }

    public Map<String, BigDecimal> financeRevenueByDayOrDefault(LocalDate from, LocalDate to) {
        return orDefault("paiements-service",
                () -> http.get(paiements, "/internal/finance/revenue-by-day?from=" + from + "&to=" + to,
                        new ParameterizedTypeReference<Map<String, BigDecimal>>() { }),
                Map.of());
    }

    // ------------------------------------------------------------------ promotions-service
    public PromotionResult applyPromotion(String code, BigDecimal amount) {
        return http.post(promotions, "/internal/promotions/apply", new PromoBody(code, amount), PromotionResult.class);
    }

    // ------------------------------------------------------------------ notifications-service
    /** Best effort: a notification failure must never break the business operation that triggered it. */
    public void notifyQuietly(NotificationCommand command) {
        try {
            http.post(notifications, "/internal/notifications", command, Void.class);
        } catch (RuntimeException ex) {
            log.warn("notification '{}' non envoyee : {}", command.templateCode(), ex.getMessage());
        }
    }

    // ------------------------------------------------------------------ helpers
    private <T> Optional<T> optional(Supplier<T> call) {
        try {
            return Optional.ofNullable(call.get());
        } catch (ResourceNotFoundException ex) {
            return Optional.empty();
        }
    }

    private <T> T orDefault(String service, Supplier<T> call, T fallback) {
        try {
            T value = call.get();
            return value == null ? fallback : value;
        } catch (RemoteServiceException ex) {
            log.warn("{} indisponible, valeur par defaut utilisee : {}", service, ex.getMessage());
            return fallback;
        }
    }
}
