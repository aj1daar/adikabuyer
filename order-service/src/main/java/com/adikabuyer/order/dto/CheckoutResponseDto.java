package com.adikabuyer.order.dto;

import java.math.BigDecimal;

public record CheckoutResponseDto(
        String orderId,
        long orderNumber,
        BigDecimal itemsTotal,
        BigDecimal deliveryFee,
        BigDecimal grandTotal
) {
}
