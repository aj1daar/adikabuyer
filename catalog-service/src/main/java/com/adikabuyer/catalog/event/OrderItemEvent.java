package com.adikabuyer.catalog.event;

import java.math.BigDecimal;
import java.util.Map;

public record OrderItemEvent(
        Long variantId,
        String productName,
        String sku,
        Map<String, Object> attributes,
        BigDecimal unitPrice,
        Integer quantity
) {
}
