package com.mirador.hotel.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class PaymentDtos {

    private PaymentDtos() {
    }

    public record PaymentRequest(
            @NotBlank(message = "Le code de la facture est obligatoire")
            String invoiceCode,

            @NotNull(message = "Le montant est obligatoire")
            @DecimalMin(value = "0.01", message = "Le montant doit etre positif")
            BigDecimal amount,

            @NotBlank(message = "Le mode de paiement est obligatoire")
            String method,

            /** Demo/test only: name of a saga step to make fail. Ignored unless paiements.saga.fault-injection=true. */
            String simulateFailureAt) {
    }

    public record StepView(String name, String status, String detail, LocalDateTime at) {
    }

    public record SagaView(Long id, String type, String status, LocalDateTime startedAt, LocalDateTime endedAt,
                           List<StepView> steps) {
    }

    public record PaymentResponse(
            Long id,
            String reference,
            String invoiceCode,
            Long clientId,
            BigDecimal amount,
            String method,
            String status,
            String failureReason,
            LocalDateTime createdAt,
            SagaView saga) {
    }
}
