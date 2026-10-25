package com.mirador.hotel.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class PromotionDtos {

    private PromotionDtos() {
    }

    public record PromotionRequest(
            @NotBlank(message = "Le code est obligatoire")
            @Pattern(regexp = "[A-Za-z0-9_-]{3,40}", message = "Le code doit contenir 3 a 40 caracteres alphanumeriques")
            String code,

            @NotBlank(message = "Le libelle est obligatoire")
            String label,

            @NotBlank(message = "Le type de remise est obligatoire")
            @Pattern(regexp = "PERCENT|FIXED", message = "Le type doit etre PERCENT ou FIXED")
            String discountType,

            @NotNull(message = "La valeur de la remise est obligatoire")
            @DecimalMin(value = "0.01", message = "La valeur doit etre positive")
            BigDecimal discountValue,

            @PositiveOrZero(message = "Le montant minimum doit etre positif ou nul")
            BigDecimal minAmount,

            @NotNull(message = "La date de debut est obligatoire")
            LocalDate startDate,

            @NotNull(message = "La date de fin est obligatoire")
            LocalDate endDate,

            @PositiveOrZero(message = "La limite d'utilisation doit etre positive ou nulle")
            Integer usageLimit,

            Boolean active) {
    }

    public record PromotionResponse(
            Long id,
            String code,
            String label,
            String discountType,
            BigDecimal discountValue,
            BigDecimal minAmount,
            LocalDate startDate,
            LocalDate endDate,
            Integer usageLimit,
            int usedCount,
            boolean active,
            boolean currentlyValid) {
    }

    public record ValidateRequest(
            @NotBlank(message = "Le code est obligatoire") String code,
            @NotNull(message = "Le montant est obligatoire") BigDecimal amount) {
    }
}
