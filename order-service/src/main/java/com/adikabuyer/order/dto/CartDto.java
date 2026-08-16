package com.adikabuyer.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CartDto(
        @NotBlank @Size(max = 200) String customerName,
        @NotBlank @Size(max = 30) String customerPhone,
        @NotBlank @Size(max = 100) String region,
        @NotEmpty @Size(max = 50) @Valid List<CartItemDto> items
) {
}
