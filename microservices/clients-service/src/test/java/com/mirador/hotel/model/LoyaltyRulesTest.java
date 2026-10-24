package com.mirador.hotel.model;

import com.mirador.hotel.client.RemoteApi;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoyaltyRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 24);

    private static RemoteApi.ReservationInfo stay(String status, int outInDays, String amount) {
        return new RemoteApi.ReservationInfo(1, 7, "101", TODAY.plusDays(outInDays - 2), TODAY.plusDays(outInDays),
                status, new BigDecimal(amount), "RS1");
    }

    @Test
    void onlyFinishedNonCancelledStaysCount() {
        assertTrue(LoyaltyRules.isCompleted(stay("Confirmée", -1, "1"), TODAY));
        assertTrue(LoyaltyRules.isCompleted(stay("Terminé", 3, "1"), TODAY));
        assertTrue(LoyaltyRules.isCompleted(stay("En cours", 0, "1"), TODAY));
        assertFalse(LoyaltyRules.isCompleted(stay("Confirmée", 2, "1"), TODAY));
        assertFalse(LoyaltyRules.isCompleted(stay("Annulée", -5, "1"), TODAY));
    }

    @Test
    void onePointPerThousandFcfaRoundedDown() {
        LoyaltyRules.Status s = LoyaltyRules.evaluate(List.of(
                stay("Terminé", -10, "75000"), stay("Confirmée", -3, "25999"),
                stay("Annulée", -3, "500000"), stay("Confirmée", 5, "900000")), TODAY);
        assertEquals(2, s.completedStays());
        assertEquals(new BigDecimal("100999"), s.totalSpent());
        assertEquals(100, s.points());
        assertEquals(LoyaltyRules.Tier.ARGENT, s.tier());
        assertEquals(LoyaltyRules.Tier.OR, s.nextTier());
        assertEquals(400, s.pointsToNextTier());
    }

    @Test
    void tierThresholds() {
        assertEquals(LoyaltyRules.Tier.BRONZE, LoyaltyRules.Tier.of(0));
        assertEquals(LoyaltyRules.Tier.BRONZE, LoyaltyRules.Tier.of(99));
        assertEquals(LoyaltyRules.Tier.ARGENT, LoyaltyRules.Tier.of(100));
        assertEquals(LoyaltyRules.Tier.OR, LoyaltyRules.Tier.of(500));
        assertEquals(LoyaltyRules.Tier.PLATINE, LoyaltyRules.Tier.of(1500));
        assertNull(LoyaltyRules.Tier.PLATINE.next());
    }

    @Test
    void noStayMeansBronzeWithZeroPoints() {
        LoyaltyRules.Status s = LoyaltyRules.evaluate(List.of(), TODAY);
        assertEquals(0, s.points());
        assertEquals(LoyaltyRules.Tier.BRONZE, s.tier());
        assertEquals(100, s.pointsToNextTier());
    }
}
