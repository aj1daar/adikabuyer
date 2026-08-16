package com.adikabuyer.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 2000) String description,
        @Size(max = 100) String category,
        @NotNull @Positive BigDecimal basePrice,
        boolean active,
        @Size(max = 500) String imageUrl,
        @Valid @Size(max = 100) List<VariantRequest> variants
) {
}
