package com.adikabuyer.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDto(
        String id,
        Long number,
        String customerName,
        String customerPhone,
        String region,
        BigDecimal itemsTotal,
        BigDecimal deliveryFee,
        BigDecimal grandTotal,
        Instant createdAt,
        List<OrderItemDto> items
) {
}
