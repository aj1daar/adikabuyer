package com.adikabuyer.order.telegram;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

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
        restClient.post()
                .uri("/sendMessage")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("chat_id", chatId, "text", text))
                .retrieve()
                .toBodilessEntity();
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
}
