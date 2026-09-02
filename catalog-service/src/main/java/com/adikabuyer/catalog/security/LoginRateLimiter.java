package com.adikabuyer.catalog.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Two-tier login throttle:
 * <ul>
 *   <li>per-client: {@value #MAX_ATTEMPTS_PER_KEY} attempts / {@link #WINDOW}, keyed by the
 *       caller IP (which Caddy overwrites with the real peer, so it can't be spoofed);</li>
 *   <li>global: {@value #MAX_ATTEMPTS_GLOBAL} attempts / {@link #WINDOW} across every client,
 *       a backstop that still bites if the per-client key is ever attacker-controlled
 *       (spoofed header, misconfigured proxy). There is a single admin account, so a burst
 *       of logins from many IPs is always an attack.</li>
 * </ul>
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS_PER_KEY = 5;
    private static final int MAX_ATTEMPTS_GLOBAL = 20;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final Map<String, AttemptWindow> attemptsByKey = new ConcurrentHashMap<>();
    private final AttemptWindow globalWindow = new AttemptWindow();

    public boolean isAllowed(String key) {
        AttemptWindow window = attemptsByKey.computeIfAbsent(key, ignored -> new AttemptWindow());
        boolean perKeyOk = window.recordAndCheck(MAX_ATTEMPTS_PER_KEY);
        boolean globalOk = globalWindow.recordAndCheck(MAX_ATTEMPTS_GLOBAL);
        return perKeyOk && globalOk;
    }

    @Scheduled(fixedRate = 60000)
    public void evictExpiredWindows() {
        Instant cutoff = Instant.now().minus(WINDOW);
        attemptsByKey.values().removeIf(window -> window.lastAttempt.isBefore(cutoff));
    }

    void reset() {
        attemptsByKey.clear();
        globalWindow.reset();
    }

    private static final class AttemptWindow {
        private int count = 0;
        private Instant windowStart = Instant.now();
        private volatile Instant lastAttempt = Instant.now();

        synchronized boolean recordAndCheck(int max) {
            Instant now = Instant.now();
            lastAttempt = now;
            if (Duration.between(windowStart, now).compareTo(WINDOW) > 0) {
                windowStart = now;
                count = 0;
            }
            count++;
            return count <= max;
        }

        synchronized void reset() {
            count = 0;
            windowStart = Instant.now();
        }
    }
}
