package com.mirador.hotel.service;

import com.mirador.hotel.exception.InvalidCredentialsException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Slows down password guessing: after {@value #MAX_FAILURES} failed logins in a row on the same account name,
 * that name is refused for {@link #LOCK} (even with the right password). A successful login resets the count.
 * Kept in memory: one instance of the service handles the logins.
 */
@Component
public class LoginAttemptGuard {

    static final int MAX_FAILURES = 5;
    static final Duration LOCK = Duration.ofMinutes(15);
    private static final int MAX_TRACKED = 10_000;   // names tried at random must not fill the memory

    private record Attempts(int failures, Instant lockedUntil) {
    }

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    public void checkNotLocked(String username) {
        Attempts current = attempts.get(key(username));
        if (current == null || current.lockedUntil() == null) {
            return;
        }
        Instant now = Instant.now();
        if (now.isBefore(current.lockedUntil())) {
            long minutes = Math.max(1, (Duration.between(now, current.lockedUntil()).toSeconds() + 59) / 60);
            throw new InvalidCredentialsException("Trop de tentatives de connexion echouees. Reessayez dans "
                    + minutes + " minute" + (minutes > 1 ? "s" : "") + ".");
        }
        attempts.remove(key(username), current);
    }

    public void recordFailure(String username) {
        if (attempts.size() > MAX_TRACKED) {
            Instant now = Instant.now();
            attempts.values().removeIf(a -> a.lockedUntil() == null || now.isAfter(a.lockedUntil()));
        }
        attempts.compute(key(username), (k, current) -> {
            int failures = (current == null || current.lockedUntil() != null ? 0 : current.failures()) + 1;
            return failures >= MAX_FAILURES
                    ? new Attempts(failures, Instant.now().plus(LOCK))
                    : new Attempts(failures, null);
        });
    }

    public void recordSuccess(String username) {
        attempts.remove(key(username));
    }

    private static String key(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }
}
