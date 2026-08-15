package com.adikabuyer.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderPlacedEvent(
        String orderId,
        String customerName,
        String customerPhone,
        String region,
        List<CartItemDto> items,
        BigDecimal itemsTotal,
        BigDecimal deliveryFee,
        BigDecimal grandTotal,
        Instant placedAt
) {
}
