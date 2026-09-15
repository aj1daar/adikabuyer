package com.adikabuyer.catalog.dto;

import com.adikabuyer.catalog.domain.VariantStatus;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Authoritative pricing/availability for a single variant, used by order-service to
 * re-price a cart server-side at checkout instead of trusting client-supplied prices.
 */
public record VariantPricingDto(
        Long variantId,
        String productName,
        String sku,
        Map<String, Object> attributes,
        BigDecimal unitPrice,
        Integer stockQuantity,
        boolean active,
        VariantStatus status
) {
}
