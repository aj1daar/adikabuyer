package com.adikabuyer.order.telegram;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TelegramMessage(TelegramChat chat, TelegramUser from, String text) {
}
