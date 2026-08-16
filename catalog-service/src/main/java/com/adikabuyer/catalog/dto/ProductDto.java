package com.adikabuyer.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductDto(
        Long id,
        String name,
        String description,
        String category,
        BigDecimal basePrice,
        boolean active,
        String imageUrl,
        List<VariantDto> variants
) {
}
