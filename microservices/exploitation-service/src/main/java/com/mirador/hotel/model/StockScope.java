package com.mirador.hotel.model;

import com.mirador.hotel.util.ValueUtils;

import java.util.Locale;

public enum StockScope {
    STOCK_MODULE,
    BAR,
    RESTAURANT,
    SERVICE,
    HOUSEKEEPING,
    OTHER;

    public static String normalize(String rawScope) {
        String normalized = ValueUtils.trimToNull(rawScope);
        if (normalized == null) {
            return STOCK_MODULE.name();
        }

        String upper = normalized.toUpperCase(Locale.ROOT);
        for (StockScope scope : values()) {
            if (scope.name().equals(upper)) {
                return upper;
            }
        }
        return OTHER.name();
    }
}
