package com.mirador.hotel.dto;

import java.math.BigDecimal;

public record CompteComptableResponse(
        String numcompte,
        String numeroPlan,
        String libellePlan,
        String libelleCompte,
        BigDecimal solde,
        BigDecimal cumulDepot,
        BigDecimal cumulRetrait,
        String typeCompte) {
}
