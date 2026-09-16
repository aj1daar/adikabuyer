package com.adikabuyer.order.dto;

import com.adikabuyer.order.domain.OrderStatus;

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
        OrderStatus status,
        Instant statusUpdatedAt,
        List<OrderItemDto> items
) {
}
