package com.adikabuyer.order.dto;

import java.math.BigDecimal;

public record CheckoutResponseDto(
        String orderId,
        BigDecimal itemsTotal,
        BigDecimal deliveryFee,
        BigDecimal grandTotal,
        String whatsappUrl
) {
}
