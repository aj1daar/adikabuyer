package com.adikabuyer.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProductRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 2000) String description,
        @Size(max = 100) String category,
        boolean active,
        @Valid @Size(max = 100) List<VariantRequest> variants
) {
}
