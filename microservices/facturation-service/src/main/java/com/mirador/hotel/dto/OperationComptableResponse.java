package com.mirador.hotel.dto;

import java.math.BigDecimal;

public record OperationComptableResponse(
        long codeOperation,
        String dateOperation,
        String heureOperation,
        String numcompte,
        String libelleCompte,
        BigDecimal credit,
        BigDecimal debit,
        String typeOperation,
        Integer numTransaction,
        String numpiece,
        String libelle,
        String codeJournal,
        Integer codeDepot,
        String libelleDepot) {
}
