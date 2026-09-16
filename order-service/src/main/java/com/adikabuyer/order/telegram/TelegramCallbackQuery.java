package com.adikabuyer.order.telegram;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** A tap on an inline button: who tapped, under which message, and the button's callback data. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TelegramCallbackQuery(String id, TelegramUser from, TelegramMessage message, String data) {
}
