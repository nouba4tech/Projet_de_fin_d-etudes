package com.mirador.hotel.model;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/** Pure rules of the reviews module (no I/O): auto-flagging and rating statistics. */
public final class ReviewRules {

    private ReviewRules() {
    }

    public record Summary(long count, double average, Map<Integer, Long> distribution) {
    }

    /** True when the text contains one of the banned words (whole word, case/accents-insensitive). */
    public static boolean isFlagged(String text, List<String> bannedWords) {
        if (text == null || text.isBlank() || bannedWords.isEmpty()) {
            return false;
        }
        String normalized = " " + normalize(text) + " ";
        for (String word : bannedWords) {
            String w = normalize(word);
            if (!w.isBlank() && normalized.contains(" " + w + " ")) {
                return true;
            }
        }
        return false;
    }

    public static Summary summarize(List<Integer> ratings) {
        Map<Integer, Long> distribution = new TreeMap<>();
        for (int star = 1; star <= 5; star++) {
            distribution.put(star, 0L);
        }
        long total = 0;
        for (Integer rating : ratings) {
            if (rating != null && rating >= 1 && rating <= 5) {
                distribution.merge(rating, 1L, Long::sum);
                total += rating;
            }
        }
        long count = distribution.values().stream().mapToLong(Long::longValue).sum();
        double average = count == 0 ? 0.0 : Math.round(total * 10.0 / count) / 10.0;
        return new Summary(count, average, distribution);
    }

    private static String normalize(String value) {
        String lower = java.text.Normalizer.normalize(value.toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return lower.replaceAll("[^a-z0-9]+", " ").trim();
    }
}
