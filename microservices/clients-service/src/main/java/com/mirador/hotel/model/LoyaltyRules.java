package com.mirador.hotel.model;

import com.mirador.hotel.client.RemoteApi;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Loyalty programme (pure rules, unit tested). 1 point per 1 000 FCFA spent on completed stays.
 * Bronze from 0, Argent from 100, Or from 500, Platine from 1 500 points.
 */
public final class LoyaltyRules {

    public static final BigDecimal FCFA_PER_POINT = BigDecimal.valueOf(1000);

    public enum Tier {
        BRONZE(0, "Accueil personnalise"),
        ARGENT(100, "-5 % sur l'hebergement, depart tardif sur demande"),
        OR(500, "-10 % sur l'hebergement, surclassement selon disponibilite"),
        PLATINE(1500, "-15 % sur l'hebergement, petit-dejeuner offert, surclassement garanti");

        public final int minPoints;
        public final String benefits;

        Tier(int minPoints, String benefits) {
            this.minPoints = minPoints;
            this.benefits = benefits;
        }

        public static Tier of(long points) {
            Tier result = BRONZE;
            for (Tier tier : values()) {
                if (points >= tier.minPoints) {
                    result = tier;
                }
            }
            return result;
        }

        public Tier next() {
            return ordinal() + 1 < values().length ? values()[ordinal() + 1] : null;
        }
    }

    public record Status(long points, Tier tier, Tier nextTier, long pointsToNextTier, BigDecimal totalSpent,
                         int completedStays) {
    }

    private LoyaltyRules() {
    }

    public static boolean isCancelled(String status) {
        return "Annulée".equals(status) || "Annulee".equals(status) || "Cancelled".equals(status);
    }

    /** A stay counts once it is over (or explicitly "Terminé") and was not cancelled. */
    public static boolean isCompleted(RemoteApi.ReservationInfo r, LocalDate today) {
        if (isCancelled(r.status())) {
            return false;
        }
        return "Terminé".equals(r.status()) || (r.checkOut() != null && !r.checkOut().isAfter(today));
    }

    public static Status evaluate(List<RemoteApi.ReservationInfo> reservations, LocalDate today) {
        BigDecimal spent = BigDecimal.ZERO;
        int completed = 0;
        for (RemoteApi.ReservationInfo r : reservations) {
            if (isCompleted(r, today)) {
                completed++;
                spent = spent.add(r.totalAmount() == null ? BigDecimal.ZERO : r.totalAmount());
            }
        }
        long points = spent.divide(FCFA_PER_POINT, 0, RoundingMode.DOWN).longValue();
        Tier tier = Tier.of(points);
        Tier next = tier.next();
        return new Status(points, tier, next, next == null ? 0 : next.minPoints - points, spent, completed);
    }
}
