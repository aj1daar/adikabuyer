package com.adikabuyer.order.telegram;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Caps guesses at the bot's registration password, both windows
 * {@code app.telegram.registration-window-seconds} long:
 * <ul>
 *   <li>per chat: {@code registration-max-attempts-per-chat} tries;</li>
 *   <li>global: {@code registration-max-attempts-global} tries across every chat — a backstop
 *       against an attacker rotating through many Telegram accounts.</li>
 * </ul>
 * A successful registration receives every customer's name and phone, so this is guarded
 * like the admin login.
 */
@Slf4j
@Component
public class RegistrationAttemptLimiter {

    private final int maxPerChat;
    private final int maxGlobal;
    private final Duration window;
    private final Map<Long, AttemptWindow> attemptsByChat = new ConcurrentHashMap<>();
    private final AttemptWindow globalWindow;

    public RegistrationAttemptLimiter(
            @Value("${app.telegram.registration-max-attempts-per-chat:5}") int maxPerChat,
            @Value("${app.telegram.registration-max-attempts-global:30}") int maxGlobal,
            @Value("${app.telegram.registration-window-seconds:3600}") long windowSeconds
    ) {
        this.maxPerChat = maxPerChat;
        this.maxGlobal = maxGlobal;
        this.window = Duration.ofSeconds(windowSeconds);
        this.globalWindow = new AttemptWindow(this.window);
    }

    /** Records one password attempt for the chat; false once the chat or the bot is over its cap. */
    public boolean tryAcquire(long chatId) {
        boolean chatOk = attemptsByChat.computeIfAbsent(chatId, ignored -> new AttemptWindow(window)).recordAndCheck(maxPerChat);
        boolean globalOk = globalWindow.recordAndCheck(maxGlobal);
        if (!chatOk || !globalOk) {
            log.warn("Telegram registration attempt refused for chat {} ({} limit reached)", chatId, chatOk ? "global" : "per-chat");
        }
        return chatOk && globalOk;
    }

    @Scheduled(fixedRate = 60000)
    public void evictExpiredWindows() {
        Instant cutoff = Instant.now().minus(window);
        attemptsByChat.values().removeIf(w -> w.lastAttempt.isBefore(cutoff));
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
