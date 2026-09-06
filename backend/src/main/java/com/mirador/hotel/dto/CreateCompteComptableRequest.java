package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CreateCompteComptableRequest(
        @NotBlank(message = "Le numero du compte est obligatoire")
        String numcompte,

        @NotBlank(message = "Le numero du plan comptable est obligatoire")
        String numeroPlan,

        @NotBlank(message = "Le libelle du compte est obligatoire")
        String libelleCompte,

        String typeCompte,

        @PositiveOrZero(message = "Le solde initial doit etre positif ou nul")
        BigDecimal solde,

        @PositiveOrZero(message = "Le cumul depot doit etre positif ou nul")
        BigDecimal cumulDepot,

        @PositiveOrZero(message = "Le cumul retrait doit etre positif ou nul")
        BigDecimal cumulRetrait) {
}
