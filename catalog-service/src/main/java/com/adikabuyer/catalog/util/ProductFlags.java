package com.adikabuyer.catalog.util;

import java.time.Duration;
import java.time.Instant;

/**
 * Derived, non-stored product flags surfaced on {@code ProductDto}.
 */
public final class ProductFlags {

    /** A product wears the "Новинка" sticker for two weeks after it is added. */
    public static final Duration NEW_FOR = Duration.ofDays(14);

    private ProductFlags() {
    }

    public static boolean isNew(Instant createdAt) {
        return isNew(createdAt, Instant.now());
    }

    static boolean isNew(Instant createdAt, Instant now) {
        return createdAt != null && !createdAt.isBefore(now.minus(NEW_FOR));
    }
}
