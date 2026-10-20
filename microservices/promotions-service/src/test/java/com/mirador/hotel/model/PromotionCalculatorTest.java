package com.mirador.hotel.model;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.model.PromotionCalculator.Promo;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PromotionCalculatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 19);

    private static Promo promo(String type, String value, String min, LocalDate start, LocalDate end, Integer limit, int used, boolean active) {
        return new Promo("ETE10", type, new BigDecimal(value), new BigDecimal(min), start, end, limit, used, active);
    }

    private static Promo valid(String type, String value) {
        return promo(type, value, "0", TODAY.minusDays(5), TODAY.plusDays(5), null, 0, true);
    }

    private static BigDecimal d(String v) {
        return new BigDecimal(v);
    }

    @Test
    void percentageDiscount() {
        RemoteApi.PromotionResult r = PromotionCalculator.evaluate(valid("PERCENT", "10"), d("100000"), TODAY);
        assertTrue(r.valid());
        assertEquals(d("10000.00"), r.discount());
        assertEquals(d("90000.00"), r.finalAmount());
    }

    @Test
    void percentageIsRoundedToTwoDecimals() {
        RemoteApi.PromotionResult r = PromotionCalculator.evaluate(valid("PERCENT", "12.5"), d("33333"), TODAY);
        assertEquals(d("4166.63"), r.discount());
        assertEquals(d("29166.37"), r.finalAmount());
    }

    @Test
    void fixedDiscountIsCappedAtTheAmount() {
        RemoteApi.PromotionResult r = PromotionCalculator.evaluate(valid("FIXED", "50000"), d("30000"), TODAY);
        assertTrue(r.valid());
        assertEquals(d("30000.00"), r.discount());
        assertEquals(d("0.00"), r.finalAmount());
    }

    @Test
    void unknownCodeIsRejected() {
        RemoteApi.PromotionResult r = PromotionCalculator.evaluate(null, d("100"), TODAY);
        assertFalse(r.valid());
        assertEquals("Code promotion inconnu", r.reason());
    }

    @Test
    void inactiveExpiredAndFutureArerejected() {
        assertFalse(PromotionCalculator.evaluate(promo("PERCENT", "10", "0", TODAY.minusDays(5), TODAY.plusDays(5), null, 0, false), d("100"), TODAY).valid());
        assertFalse(PromotionCalculator.evaluate(promo("PERCENT", "10", "0", TODAY.minusDays(9), TODAY.minusDays(1), null, 0, true), d("100"), TODAY).valid());
        assertFalse(PromotionCalculator.evaluate(promo("PERCENT", "10", "0", TODAY.plusDays(1), TODAY.plusDays(9), null, 0, true), d("100"), TODAY).valid());
    }

    @Test
    void boundariesOfTheValidityPeriodAreInclusive() {
        assertTrue(PromotionCalculator.evaluate(promo("PERCENT", "10", "0", TODAY, TODAY, null, 0, true), d("100"), TODAY).valid());
    }

    @Test
    void usageLimitAndMinimumAmountAreEnforced() {
        assertFalse(PromotionCalculator.evaluate(promo("PERCENT", "10", "0", TODAY.minusDays(1), TODAY.plusDays(1), 5, 5, true), d("100"), TODAY).valid());
        assertTrue(PromotionCalculator.evaluate(promo("PERCENT", "10", "0", TODAY.minusDays(1), TODAY.plusDays(1), 5, 4, true), d("100"), TODAY).valid());

        Promo minimum = promo("PERCENT", "10", "50000", TODAY.minusDays(1), TODAY.plusDays(1), null, 0, true);
        assertFalse(PromotionCalculator.evaluate(minimum, d("49999"), TODAY).valid());
        assertTrue(PromotionCalculator.evaluate(minimum, d("50000"), TODAY).valid());
    }

    @Test
    void nonPositiveAmountIsRejected() {
        assertFalse(PromotionCalculator.evaluate(valid("PERCENT", "10"), d("0"), TODAY).valid());
        assertFalse(PromotionCalculator.evaluate(valid("PERCENT", "10"), null, TODAY).valid());
    }
}
