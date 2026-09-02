package com.adikabuyer.order.config;

import com.adikabuyer.order.telegram.TelegramProperties;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;

class TelegramConfigTest {

    @Test
    void telegramRestClient_buildsWithBotTokenInBaseUrl() {
        TelegramProperties properties = new TelegramProperties();
        properties.setBotToken("abc123");

        RestClient restClient = new TelegramConfig().telegramRestClient(properties);

        assertThat(restClient).isNotNull();
    }
}
