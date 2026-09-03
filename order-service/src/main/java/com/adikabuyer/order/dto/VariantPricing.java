package com.adikabuyer.order.dto;

import java.math.BigDecimal;

/** Authoritative variant pricing/availability fetched from catalog-service at checkout. */
public record VariantPricing(
        Long variantId,
        String productName,
        String sku,
        BigDecimal unitPrice,
        Integer stockQuantity,
        Boolean active,
        String status
) {
}
