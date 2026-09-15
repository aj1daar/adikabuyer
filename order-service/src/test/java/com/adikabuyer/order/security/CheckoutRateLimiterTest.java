package com.adikabuyer.order.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CheckoutRateLimiterTest {

    private final CheckoutRateLimiter rateLimiter = new CheckoutRateLimiter(5, 600);

    @Test
    void isAllowed_returnsTrue_forFirstFiveCheckouts() {
        for (int i = 0; i < 5; i++) {
            assertThat(rateLimiter.isAllowed("1.2.3.4")).isTrue();
        }
    }

    @Test
    void isAllowed_returnsFalse_onSixthCheckoutWithinWindow() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.isAllowed("1.2.3.4");
        }

        assertThat(rateLimiter.isAllowed("1.2.3.4")).isFalse();
    }

    @Test
    void isAllowed_tracksEachClientIndependently_soOneNoisyClientBlocksNobodyElse() {
        for (int i = 0; i < 50; i++) {
            rateLimiter.isAllowed("1.2.3.4");
        }

        assertThat(rateLimiter.isAllowed("5.6.7.8")).isTrue();
    }

    @Test
    void isAllowed_startsAFreshWindow_onceTheOldOneExpires() throws InterruptedException {
        CheckoutRateLimiter shortWindow = new CheckoutRateLimiter(1, 1);
        assertThat(shortWindow.isAllowed("1.2.3.4")).isTrue();
        assertThat(shortWindow.isAllowed("1.2.3.4")).isFalse();

        Thread.sleep(1100);

        assertThat(shortWindow.isAllowed("1.2.3.4")).isTrue();
    }

    @Test
    void evictExpiredWindows_doesNotThrow_whenMapIsEmpty() {
        rateLimiter.evictExpiredWindows();
        assertThat(rateLimiter.isAllowed("1.2.3.4")).isTrue();
    }
}
