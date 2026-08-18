package com.adikabuyer.order.dto;

import java.math.BigDecimal;
import java.util.Map;

public record OrderItemDto(
        Long variantId,
        String productName,
        String sku,
        Map<String, Object> attributes,
        BigDecimal unitPrice,
        Integer quantity
) {
}
