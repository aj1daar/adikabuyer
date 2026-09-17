package com.adikabuyer.order.telegram;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class TelegramApiClient {

    private final RestClient restClient;

    public TelegramApiClient(RestClient telegramRestClient) {
        this.restClient = telegramRestClient;
    }

    public void sendMessage(long chatId, String text) {
        sendMessage(chatId, text, List.of());
    }

    /** Sends a message with rows of inline buttons under it (no rows = a plain message). */
    public void sendMessage(long chatId, String text, List<List<InlineButton>> keyboard) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("chat_id", chatId);
        body.put("text", text);
        if (keyboard != null && !keyboard.isEmpty()) {
            body.put("reply_markup", Map.of("inline_keyboard",
                    keyboard.stream().map(row -> row.stream().map(InlineButton::toApi).toList()).toList()));
        }
        post("/sendMessage", body);
    }

    /** Replaces a message's text; the buttons disappear because no keyboard is sent back. */
    public void editMessageText(long chatId, long messageId, String text) {
        post("/editMessageText", Map.of("chat_id", chatId, "message_id", messageId, "text", text));
    }

    /** Clears the loading spinner on a tapped button, optionally with a short toast. */
    public void answerCallbackQuery(String callbackQueryId, String text) {
        post("/answerCallbackQuery", Map.of("callback_query_id", callbackQueryId, "text", text));
    }

    public List<TelegramUpdate> getUpdates(long offset, int timeoutSeconds) {
        TelegramUpdatesResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/getUpdates")
                        .queryParam("offset", offset)
                        .queryParam("timeout", timeoutSeconds)
                        .build())
                .retrieve()
                .body(TelegramUpdatesResponse.class);
        return response != null && response.result() != null ? response.result() : List.of();
    }

    private void post(String path, Map<String, Object> body) {
        restClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }
}
