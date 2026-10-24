package com.mirador.hotel.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class ClientInsightDtos {

    private ClientInsightDtos() {
    }

    public record Stay(long reservationId, String roomId, LocalDate checkIn, LocalDate checkOut, String status,
                       BigDecimal amount, String invoiceCode, boolean completed) {
    }

    public record History(long clientId, String clientName, int reservations, int completedStays, int cancelled,
                          BigDecimal totalSpent, List<Stay> stays) {
    }

    public record Loyalty(long clientId, String clientName, long points, String tier, String benefits,
                          String nextTier, long pointsToNextTier, BigDecimal totalSpent, int completedStays) {
    }
}
