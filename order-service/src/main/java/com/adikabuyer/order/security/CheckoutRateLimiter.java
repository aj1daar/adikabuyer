package com.adikabuyer.order.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-client throttle for the anonymous checkout: {@code app.security.checkout.max-per-ip}
 * orders per {@code app.security.checkout.window-seconds}, keyed by the caller IP (Caddy
 * stamps {@code X-Real-Ip} with the real peer). Deliberately no global cap — that would let
 * one noisy client block every real customer.
 */
@Component
public class CheckoutRateLimiter {

    private final int maxPerKey;
    private final Duration window;
    private final Map<String, AttemptWindow> attemptsByKey = new ConcurrentHashMap<>();

    public CheckoutRateLimiter(
            @Value("${app.security.checkout.max-per-ip:5}") int maxPerKey,
            @Value("${app.security.checkout.window-seconds:600}") long windowSeconds
    ) {
        this.maxPerKey = maxPerKey;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    public boolean isAllowed(String key) {
        return attemptsByKey.computeIfAbsent(key, ignored -> new AttemptWindow(window)).recordAndCheck(maxPerKey);
    }

    @Scheduled(fixedRate = 60000)
    public void evictExpiredWindows() {
        Instant cutoff = Instant.now().minus(window);
        attemptsByKey.values().removeIf(w -> w.lastAttempt.isBefore(cutoff));
    }

    private static final class AttemptWindow {
        private final Duration window;
        private int count = 0;
        private Instant windowStart = Instant.now();
        private volatile Instant lastAttempt = Instant.now();

        AttemptWindow(Duration window) {
            this.window = window;
        }

        synchronized boolean recordAndCheck(int max) {
            Instant now = Instant.now();
            lastAttempt = now;
            if (Duration.between(windowStart, now).compareTo(window) > 0) {
                windowStart = now;
                count = 0;
            }
            count++;
            return count <= max;
        }
    }
}
