package com.adikabuyer.catalog.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductDto(
        Long id,
        String name,
        String description,
        String category,
        BigDecimal basePrice,
        BigDecimal displayPrice,
        boolean active,
        String imageUrl,
        Map<String, String> colorSwatches,
        List<String> labels,
        boolean isNew,
        List<VariantDto> variants
) {
}
