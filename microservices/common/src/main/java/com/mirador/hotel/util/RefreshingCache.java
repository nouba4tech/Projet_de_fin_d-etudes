package com.mirador.hotel.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Supplier;

/**
 * Small in-memory cache for figures that are expensive to compute and may be a little stale (dashboard counts).
 * <ul>
 *   <li>The first request for a key computes the value; concurrent requests for that key wait for that single
 *       computation instead of all running it.</li>
 *   <li>Once the value is older than the time-to-live, requests keep receiving it while one background task
 *       recomputes it: no visitor ever waits for a refresh.</li>
 * </ul>
 */
public final class RefreshingCache {

    private static final Logger log = LoggerFactory.getLogger(RefreshingCache.class);

    private final class Entry {
        private volatile Object value;
        private volatile Instant computedAt;
        private final AtomicBoolean refreshing = new AtomicBoolean();

        private Entry(Object value) {
            this.value = value;
            this.computedAt = Instant.now();
        }
    }

    private final Duration timeToLive;
    private final ConcurrentHashMap<String, Entry> entries = new ConcurrentHashMap<>();
    private final ExecutorService refresher;

    public RefreshingCache(String name, Duration timeToLive) {
        this.timeToLive = timeToLive;
        this.refresher = Executors.newSingleThreadExecutor(runnable -> {
            Thread thread = new Thread(runnable, name + "-cache-refresh");
            thread.setDaemon(true);
            return thread;
        });
    }

    @SuppressWarnings("unchecked")
    public <T> T get(String key, Supplier<T> loader) {
        Entry entry = entries.computeIfAbsent(key, k -> new Entry(loader.get()));
        if (entry.computedAt.plus(timeToLive).isBefore(Instant.now()) && entry.refreshing.compareAndSet(false, true)) {
            refresher.execute(() -> {
                try {
                    entry.value = loader.get();
                    entry.computedAt = Instant.now();
                } catch (RuntimeException ex) {
                    log.warn("rafraichissement du cache '{}' en echec, ancienne valeur conservee : {}", key, ex.getMessage());
                } finally {
                    entry.refreshing.set(false);
                }
            });
        }
        return (T) entry.value;
    }
}
