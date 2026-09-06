package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateCompteComptableRequest(
        @NotBlank(message = "Le numero du plan comptable est obligatoire")
        String numeroPlan,

        @NotBlank(message = "Le libelle du compte est obligatoire")
        String libelleCompte,

        String typeCompte) {
}
