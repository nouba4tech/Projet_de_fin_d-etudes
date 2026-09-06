package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record OperationComptableRequest(
        String dateOperation,
        String heureOperation,

        @NotBlank(message = "Le compte comptable est obligatoire")
        String numcompte,

        @PositiveOrZero(message = "Le credit doit etre positif ou nul")
        BigDecimal credit,

        @PositiveOrZero(message = "Le debit doit etre positif ou nul")
        BigDecimal debit,

        String typeOperation,
        Integer numTransaction,
        String numpiece,

        @NotBlank(message = "Le libelle de l'operation est obligatoire")
        String libelle,

        String codeJournal,
        Integer codeDepot) {
}
