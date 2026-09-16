package com.adikabuyer.catalog.event;

import java.time.Instant;

/** order-service published this when an order was cancelled or deleted before delivery. */
public record OrderCancelledEvent(
        String orderId,
        Instant cancelledAt
) {
}
