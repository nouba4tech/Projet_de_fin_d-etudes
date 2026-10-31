package com.mirador.hotel.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Passwords are stored as BCrypt hashes (salted, deliberately slow). Accounts created before that still hold an
 * unsalted MD5 hash: it is accepted at login, then replaced by a BCrypt hash ({@link #needsUpgrade}).
 * A stored value is never compared as plain text.
 */
public final class PasswordUtils {

    private static final BCryptPasswordEncoder BCRYPT = new BCryptPasswordEncoder();
    private static final Pattern LEGACY_MD5 = Pattern.compile("[0-9a-fA-F]{32}");

    private PasswordUtils() {
    }

    public static String hash(String rawPassword) {
        return BCRYPT.encode(rawPassword);
    }

    public static boolean matches(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null) {
            return false;
        }

        String normalized = storedHash.trim();
        if (isBcrypt(normalized)) {
            return BCRYPT.matches(rawPassword, normalized);
        }
        return LEGACY_MD5.matcher(normalized).matches()
                && normalized.equalsIgnoreCase(DigestUtils.md5DigestAsHex(rawPassword.getBytes(StandardCharsets.UTF_8)));
    }

    /** True when the stored hash is an old MD5 one that should be rewritten with BCrypt. */
    public static boolean needsUpgrade(String storedHash) {
        return storedHash == null || !isBcrypt(storedHash.trim());
    }

    public static String newToken() {
        return UUID.randomUUID().toString();
    }

    private static boolean isBcrypt(String hash) {
        return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
    }
}
