package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    /** Same field names as RemoteApi.NotificationCommand, so other services can post it as is. */
    public record SendRequest(
            @NotBlank(message = "Le canal est obligatoire (EMAIL ou SMS)")
            String channel,

            @NotBlank(message = "Le destinataire est obligatoire")
            String recipient,

            String templateCode,
            String referenceKey,
            String subject,
            String body,
            Map<String, String> variables) {
    }

    public record NotificationResponse(
            Long id,
            String channel,
            String recipient,
            String templateCode,
            String referenceKey,
            String subject,
            String body,
            String status,
            String errorMessage,
            LocalDateTime createdAt,
            LocalDateTime sentAt) {
    }

    public record ReminderResult(LocalDate date, int reservations, int sent, int alreadySent, int failed) {
    }
}
