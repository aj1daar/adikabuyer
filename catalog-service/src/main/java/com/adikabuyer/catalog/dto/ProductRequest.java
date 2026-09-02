package com.adikabuyer.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public record ProductRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 2000) String description,
        @Size(max = 100) String category,
        boolean active,
        @Size(max = 50) Map<String, @Size(max = 500) String> colorSwatches,
        @Size(max = 8) List<@Size(max = 40) String> labels,
        @Size(max = 120) String brand,
        @Size(max = 100) List<@Valid VariantRequest> variants
) {
}
