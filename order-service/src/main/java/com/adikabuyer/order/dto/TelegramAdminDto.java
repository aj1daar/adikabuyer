package com.adikabuyer.order.dto;

import java.time.Instant;

public record TelegramAdminDto(
        Long chatId,
        String username,
        Instant registeredAt
) {
}
