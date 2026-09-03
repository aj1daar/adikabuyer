package com.adikabuyer.catalog.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimiterTest {

    private final LoginRateLimiter rateLimiter = new LoginRateLimiter(5, 20, 60);

    @Test
    void isAllowed_honoursConfiguredPerIpLimit() {
        LoginRateLimiter loose = new LoginRateLimiter(50, 200, 60);
        for (int i = 0; i < 40; i++) {
            assertThat(loose.isAllowed("9.9.9.9")).isTrue();
        }
    }

    @Test
    void isAllowed_returnsTrue_forFirstFiveAttempts() {
        for (int i = 0; i < 5; i++) {
            assertThat(rateLimiter.isAllowed("1.2.3.4")).isTrue();
        }
    }

    @Test
    void isAllowed_returnsFalse_onSixthAttemptWithinWindow() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.isAllowed("1.2.3.4");
        }

        assertThat(rateLimiter.isAllowed("1.2.3.4")).isFalse();
    }

    @Test
    void isAllowed_tracksEachKeyIndependently() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.isAllowed("1.2.3.4");
        }

        assertThat(rateLimiter.isAllowed("5.6.7.8")).isTrue();
    }

    @Test
    void isAllowed_returnsFalse_onGlobalCap_evenAcrossManyDistinctKeys() {
        for (int i = 0; i < 20; i++) {
            assertThat(rateLimiter.isAllowed("10.0.0." + i)).isTrue();
        }

        assertThat(rateLimiter.isAllowed("10.0.1.1")).isFalse();
    }

    @Test
    void evictExpiredWindows_doesNotThrow_whenMapIsEmpty() {
        assertThat(rateLimiter).isNotNull();
        rateLimiter.evictExpiredWindows();
    }
}
