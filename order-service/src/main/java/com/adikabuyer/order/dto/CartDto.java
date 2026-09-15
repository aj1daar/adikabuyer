package com.adikabuyer.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CartDto(
        @NotBlank @Size(max = 200) String customerName,
        // Digits with the usual phone punctuation only — no letters or markup reach the admin.
        @NotBlank @Size(max = 30) @Pattern(regexp = "\\+?[0-9 ()\\-]{5,30}", message = "must be a phone number") String customerPhone,
        // The shop only delivers inside Бишкек, so the cart can send exactly these two values.
        @NotBlank @Size(max = 100) @Pattern(regexp = "(?iu)\\s*(Бишкек|самовывоз)\\s*", message = "must be Бишкек or самовывоз") String region,
        @NotEmpty @Size(max = 50) List<@Valid CartItemDto> items
) {
}
