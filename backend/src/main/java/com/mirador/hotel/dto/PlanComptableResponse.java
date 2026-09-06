package com.mirador.hotel.dto;

import java.math.BigDecimal;

public record PlanComptableResponse(
        String numero,
        String libellePlan,
        long totalComptes,
        BigDecimal soldeTotal) {
}
