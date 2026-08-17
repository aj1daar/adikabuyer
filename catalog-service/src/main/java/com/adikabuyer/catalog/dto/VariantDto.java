package com.adikabuyer.catalog.dto;

import com.adikabuyer.catalog.domain.VariantStatus;

import java.math.BigDecimal;
import java.util.Map;

public record VariantDto(
        Long id,
        Long productId,
        String sku,
        Map<String, Object> attributes,
        BigDecimal priceOverride,
        Integer stockQuantity,
        boolean active,
        String imageUrl,
        VariantStatus status
) {
}
