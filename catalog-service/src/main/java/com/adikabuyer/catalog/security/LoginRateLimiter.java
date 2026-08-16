package com.adikabuyer.catalog.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final Map<String, AttemptWindow> attemptsByKey = new ConcurrentHashMap<>();

    public boolean isAllowed(String key) {
        AttemptWindow window = attemptsByKey.computeIfAbsent(key, ignored -> new AttemptWindow());
        return window.recordAndCheck();
    }

    @Scheduled(fixedRate = 60000)
    public void evictExpiredWindows() {
        Instant cutoff = Instant.now().minus(WINDOW);
        attemptsByKey.values().removeIf(window -> window.lastAttempt.isBefore(cutoff));
    }

    void reset() {
        attemptsByKey.clear();
    }

    private static final class AttemptWindow {
        private int count = 0;
        private Instant windowStart = Instant.now();
        private volatile Instant lastAttempt = Instant.now();

        synchronized boolean recordAndCheck() {
            Instant now = Instant.now();
            lastAttempt = now;
            if (Duration.between(windowStart, now).compareTo(WINDOW) > 0) {
                windowStart = now;
                count = 0;
            }
            count++;
            return count <= MAX_ATTEMPTS;
        }
    }
}
