package com.mirador.hotel.model;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReviewRulesTest {

    private static final List<String> BANNED = List.of("arnaque", "escroc", "merde");

    @Test
    void flagsBannedWordsIgnoringCaseAccentsAndPunctuation() {
        assertTrue(ReviewRules.isFlagged("Quelle ARNAQUE !", BANNED));
        assertTrue(ReviewRules.isFlagged("c'est de la MERDE.", BANNED));
        assertTrue(ReviewRules.isFlagged("un escroc", BANNED));
    }

    @Test
    void doesNotFlagPartialMatchesOrCleanText() {
        assertFalse(ReviewRules.isFlagged("Sejour parfait, personnel adorable", BANNED));
        assertFalse(ReviewRules.isFlagged("l'escrocquerie", List.of("escroc")));
        assertFalse(ReviewRules.isFlagged(null, BANNED));
        assertFalse(ReviewRules.isFlagged("   ", BANNED));
        assertFalse(ReviewRules.isFlagged("arnaque", List.of()));
    }

    @Test
    void summaryComputesAverageAndDistribution() {
        ReviewRules.Summary s = ReviewRules.summarize(Arrays.asList(5, 4, 5, 3, 5, null, 9, 0));
        assertEquals(5, s.count());
        assertEquals(4.4, s.average(), 0.0001);
        assertEquals(Map.of(1, 0L, 2, 0L, 3, 1L, 4, 1L, 5, 3L), s.distribution());
    }

    @Test
    void emptySummaryHasZeroAverageAndAllStarsPresent() {
        ReviewRules.Summary s = ReviewRules.summarize(List.of());
        assertEquals(0, s.count());
        assertEquals(0.0, s.average());
        assertEquals(5, s.distribution().size());
    }
}
