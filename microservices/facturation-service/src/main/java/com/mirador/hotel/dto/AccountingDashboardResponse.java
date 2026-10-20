package com.mirador.hotel.dto;

import java.math.BigDecimal;

public record AccountingDashboardResponse(
        long totalPlans,
        long totalComptes,
        long totalCaisses,
        long totalDepotsPhysiques,
        long totalOperations,
        BigDecimal soldeGlobal,
        BigDecimal totalDepotComptable,
        BigDecimal totalRetraitComptable,
        BigDecimal totalCredits,
        BigDecimal totalDebits) {
}
