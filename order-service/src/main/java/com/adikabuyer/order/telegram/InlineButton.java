package com.adikabuyer.order.telegram;

import java.util.LinkedHashMap;
import java.util.Map;

/** One button under a Telegram message: either reports a tap back to the bot or opens a link. */
public record InlineButton(String text, String callbackData, String url) {

    public static InlineButton callback(String text, String callbackData) {
        return new InlineButton(text, callbackData, null);
    }

    public static InlineButton link(String text, String url) {
        return new InlineButton(text, null, url);
    }

    Map<String, String> toApi() {
        Map<String, String> button = new LinkedHashMap<>();
        button.put("text", text);
        if (callbackData != null) {
            button.put("callback_data", callbackData);
        }
        if (url != null) {
            button.put("url", url);
        }
        return button;
    }
}
