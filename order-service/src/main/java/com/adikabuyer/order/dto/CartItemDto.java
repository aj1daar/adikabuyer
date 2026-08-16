package com.adikabuyer.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

public record CartItemDto(
        @NotNull Long variantId,
        @NotBlank @Size(max = 200) String productName,
        @NotBlank @Size(max = 100) String sku,
        Map<String, Object> attributes,
        @NotNull @Positive BigDecimal unitPrice,
        @NotNull @Positive Integer quantity
) {
}
