package com.mirador.hotel.dto;

import java.math.BigDecimal;

public record CaisseResponse(
        int codeCaisse,
        String numeroCompte,
        String libelle,
        String libelleCompte,
        BigDecimal soldeCompte) {
}
