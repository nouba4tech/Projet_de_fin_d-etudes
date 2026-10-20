package com.mirador.hotel.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class InvoiceDtos {

    private InvoiceDtos() {
    }

    public record InvoiceResponse(
            String code,
            Long clientId,
            String clientName,
            LocalDateTime date,
            BigDecimal total,
            BigDecimal discount,
            BigDecimal net,
            BigDecimal totalPaid,
            BigDecimal remaining,
            boolean paid,
            String status,
            LocalDateTime archivedAt,
            String archivedBy) {
    }

    public record InvoiceEvent(String type, String detail, LocalDateTime at) {
    }

    public record InvoiceTracking(InvoiceResponse invoice, List<InvoiceEvent> events) {
    }

    public record InvoiceStats(
            long total,
            long issued,
            long partiallyPaid,
            long paid,
            long archived,
            BigDecimal totalAmount,
            BigDecimal totalCollected,
            BigDecimal totalOutstanding) {
    }

    /** Create/update an invoice (service-to-service). */
    public record AmountRequest(Long clientId, BigDecimal amount) {
    }

    /** Register or reverse a payment on an invoice (service-to-service). */
    public record PaymentRequest(BigDecimal amount, String reference) {
    }

    public record ClientAccountRequest(String displayName) {
    }
}
