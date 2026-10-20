package com.mirador.hotel.util;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public final class DateTimeMapper {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Africa/Lagos");

    private DateTimeMapper() {
    }

    public static OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        if (timestamp == null) {
            return null;
        }
        return timestamp.toInstant().atZone(DEFAULT_ZONE).toOffsetDateTime();
    }

    public static Timestamp toTimestamp(OffsetDateTime value) {
        if (value == null) {
            return null;
        }
        return Timestamp.from(value.toInstant());
    }

    public static Timestamp toTimestamp(java.time.LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return Timestamp.valueOf(value);
    }

    public static LocalDate toLocalDate(Date value) {
        return value == null ? null : value.toLocalDate();
    }
}
