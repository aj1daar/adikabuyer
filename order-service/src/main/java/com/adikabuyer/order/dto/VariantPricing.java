package com.adikabuyer.order.dto;

import java.math.BigDecimal;
import java.util.Map;

/** Authoritative variant pricing/availability fetched from catalog-service at checkout. */
public record VariantPricing(
        Long variantId,
        String productName,
        String sku,
        Map<String, Object> attributes,
        BigDecimal unitPrice,
        Integer stockQuantity,
        Boolean active,
        String status
) {
}
