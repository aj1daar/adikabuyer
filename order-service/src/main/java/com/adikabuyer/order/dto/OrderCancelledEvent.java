package com.adikabuyer.order.dto;

import java.time.Instant;

/** Tells catalog-service to give back the stock this order took. */
public record OrderCancelledEvent(
        String orderId,
        Instant cancelledAt
) {
}
