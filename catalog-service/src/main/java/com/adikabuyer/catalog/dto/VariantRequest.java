package com.adikabuyer.catalog.dto;

import com.adikabuyer.catalog.domain.VariantStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record VariantRequest(
        Long id,
        @NotBlank @Size(max = 100) String sku,
        Map<String, Object> attributes,
        @NotNull @Positive BigDecimal priceOverride,
        @NotNull @PositiveOrZero Integer stockQuantity,
        boolean active,
        @Size(max = 20) List<@Size(max = 500) String> imageUrls,
        VariantStatus status
) {
    public VariantStatus statusOrDefault() {
        return status != null ? status : VariantStatus.IN_STOCK;
    }
}
