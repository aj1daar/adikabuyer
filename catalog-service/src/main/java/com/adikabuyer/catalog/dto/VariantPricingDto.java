package com.adikabuyer.catalog.dto;

import com.adikabuyer.catalog.domain.VariantStatus;

import java.math.BigDecimal;

/**
 * Authoritative pricing/availability for a single variant, used by order-service to
 * re-price a cart server-side at checkout instead of trusting client-supplied prices.
 */
public record VariantPricingDto(
        Long variantId,
        String productName,
        String sku,
        BigDecimal unitPrice,
        Integer stockQuantity,
        boolean active,
        VariantStatus status
) {
}
