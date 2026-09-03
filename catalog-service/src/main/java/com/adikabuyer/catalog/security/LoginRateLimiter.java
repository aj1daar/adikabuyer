package com.adikabuyer.catalog.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Two-tier login throttle, both windows {@code app.security.login.window-seconds} long:
 * <ul>
 *   <li>per-client: {@code app.security.login.max-per-ip} attempts, keyed by the caller IP
 *       (Caddy overwrites {@code X-Forwarded-For} with the real peer and the gateway is a
 *       trusted proxy, so the key can't be spoofed);</li>
 *   <li>global: {@code app.security.login.max-global} attempts across every client — a
 *       backstop for a distributed attack, since there is a single admin account.</li>
 * </ul>
 * Defaults (5 / 20 / 60s) suit production; local/dev can raise them via env.
 */
@Component
public class LoginRateLimiter {

    private final int maxPerKey;
    private final int maxGlobal;
    private final Duration window;

    private final Map<String, AttemptWindow> attemptsByKey = new ConcurrentHashMap<>();
    private final AttemptWindow globalWindow;

    public LoginRateLimiter(
            @Value("${app.security.login.max-per-ip:5}") int maxPerKey,
            @Value("${app.security.login.max-global:20}") int maxGlobal,
            @Value("${app.security.login.window-seconds:60}") long windowSeconds
    ) {
        this.maxPerKey = maxPerKey;
        this.maxGlobal = maxGlobal;
        this.window = Duration.ofSeconds(windowSeconds);
        this.globalWindow = new AttemptWindow(this.window);
    }

    public boolean isAllowed(String key) {
        AttemptWindow window = attemptsByKey.computeIfAbsent(key, ignored -> new AttemptWindow(this.window));
        boolean perKeyOk = window.recordAndCheck(maxPerKey);
        boolean globalOk = globalWindow.recordAndCheck(maxGlobal);
        return perKeyOk && globalOk;
    }

    @Scheduled(fixedRate = 60000)
    public void evictExpiredWindows() {
        Instant cutoff = Instant.now().minus(window);
        attemptsByKey.values().removeIf(w -> w.lastAttempt.isBefore(cutoff));
    }

    void reset() {
        attemptsByKey.clear();
        globalWindow.reset();
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

        synchronized void reset() {
            count = 0;
            windowStart = Instant.now();
        }
    }
}
