package com.adikabuyer.order.dto;

import java.util.List;

public record CartDto(
        String customerName,
        String customerPhone,
        String region,
        List<CartItemDto> items
) {
}
