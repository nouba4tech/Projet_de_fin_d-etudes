package com.mirador.hotel.util;

import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

public final class PasswordUtils {

    private PasswordUtils() {
    }

    public static String hash(String rawPassword) {
        return DigestUtils.md5DigestAsHex(rawPassword.getBytes(StandardCharsets.UTF_8));
    }

    public static boolean matches(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null) {
            return false;
        }

        String normalized = storedHash.trim();
        return normalized.equalsIgnoreCase(hash(rawPassword)) || normalized.equals(rawPassword);
    }

    public static String newToken() {
        return UUID.randomUUID().toString();
    }
}
