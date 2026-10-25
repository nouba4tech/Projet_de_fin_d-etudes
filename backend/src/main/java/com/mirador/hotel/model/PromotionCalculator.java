package com.mirador.hotel.model;

import com.mirador.hotel.client.RemoteApi;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/** Pure pricing rules of a promotion (no I/O): easy to unit test. */
public final class PromotionCalculator {

    public static final String PERCENT = "PERCENT";
    public static final String FIXED = "FIXED";

    private PromotionCalculator() {
    }

    /** The stored promotion, as needed by the calculation. */
    public record Promo(String code, String type, BigDecimal value, BigDecimal minAmount, LocalDate start, LocalDate end,
                        Integer usageLimit, int usedCount, boolean active) {
    }

    public static RemoteApi.PromotionResult evaluate(Promo promo, BigDecimal amount, LocalDate today) {
        if (promo == null) {
            return rejected(null, amount, "Code promotion inconnu");
        }
        if (amount == null || amount.signum() <= 0) {
            return rejected(promo.code(), amount, "Montant invalide");
        }
        if (!promo.active()) {
            return rejected(promo.code(), amount, "Promotion desactivee");
        }
        if (today.isBefore(promo.start())) {
            return rejected(promo.code(), amount, "Promotion pas encore ouverte (debut le " + promo.start() + ")");
        }
        if (today.isAfter(promo.end())) {
            return rejected(promo.code(), amount, "Promotion expiree depuis le " + promo.end());
        }
        if (promo.usageLimit() != null && promo.usedCount() >= promo.usageLimit()) {
            return rejected(promo.code(), amount, "Limite d'utilisation atteinte");
        }
        if (promo.minAmount() != null && amount.compareTo(promo.minAmount()) < 0) {
            return rejected(promo.code(), amount, "Montant minimum non atteint (" + promo.minAmount().toPlainString() + ")");
        }

        BigDecimal discount = PERCENT.equals(promo.type())
                ? amount.multiply(promo.value()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : promo.value();
        discount = discount.min(amount).setScale(2, RoundingMode.HALF_UP);
        return new RemoteApi.PromotionResult(true, promo.code(), discount, amount.subtract(discount).setScale(2, RoundingMode.HALF_UP), null);
    }

    private static RemoteApi.PromotionResult rejected(String code, BigDecimal amount, String reason) {
        BigDecimal base = amount == null ? BigDecimal.ZERO : amount;
        return new RemoteApi.PromotionResult(false, code, BigDecimal.ZERO, base, reason);
    }
}
