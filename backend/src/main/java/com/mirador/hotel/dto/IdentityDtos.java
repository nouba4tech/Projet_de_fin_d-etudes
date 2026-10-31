package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class IdentityDtos {

    private IdentityDtos() {
    }

    /**
     * Images are data URLs (JPEG or PNG). faceDistance and livenessPassed come from the face check run in the
     * browser: they are kept as indications, next to the receptionist's own visual check.
     */
    public record VerificationRequest(
            @NotNull(message = "Le client est obligatoire")
            Long clientId,

            @NotBlank(message = "Le type de piece est obligatoire")
            String documentType,

            @NotBlank(message = "Le numero de la piece est obligatoire")
            String documentNumber,

            @NotBlank(message = "Le recto de la piece est obligatoire")
            String recto,

            @NotBlank(message = "Le verso de la piece est obligatoire")
            String verso,

            @NotBlank(message = "Le selfie est obligatoire")
            String selfie,

            BigDecimal faceDistance,
            boolean livenessPassed,
            boolean consent,
            boolean visualCheck) {
    }

    public record DecisionRequest(
            @NotBlank(message = "La decision est obligatoire (VERIFIEE ou REJETEE)")
            String decision,
            String comment) {
    }

    /** Never carries the images: they are read one by one through the documents endpoint. */
    public record VerificationResponse(
            Long id,
            Long clientId,
            String documentType,
            String documentNumber,
            BigDecimal faceDistance,
            boolean faceMatch,
            boolean livenessPassed,
            String status,
            String checkedBy,
            String decidedBy,
            LocalDateTime decidedAt,
            Long reservationId,
            LocalDate purgeAfter,
            boolean purged,
            LocalDateTime createdAt) {
    }

    public record AuditEntry(Long id, String actor, String action, String target, String details, LocalDateTime createdAt) {
    }
}
