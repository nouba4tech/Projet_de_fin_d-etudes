package com.mirador.hotel.util;

import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;

public final class ValueUtils {

    private ValueUtils() {
    }

    public static BigDecimal bigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    public static Integer integer(ResultSet resultSet, String column) throws SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }

    public static Long longValue(ResultSet resultSet, String column) throws SQLException {
        long value = resultSet.getLong(column);
        return resultSet.wasNull() ? null : value;
    }

    public static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    public static String coalesce(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
