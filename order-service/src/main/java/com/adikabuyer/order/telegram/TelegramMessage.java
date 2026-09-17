package com.adikabuyer.order.telegram;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TelegramMessage(
        TelegramChat chat,
        TelegramUser from,
        String text,
        @JsonProperty("message_id") Long messageId
) {
    public TelegramMessage(TelegramChat chat, TelegramUser from, String text) {
        this(chat, from, text, null);
    }
}
