package com.adikabuyer.order.telegram;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TelegramUpdatesResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deserializesTelegramGetUpdatesResponseShape() throws Exception {
        String json = """
                {
                  "ok": true,
                  "result": [
                    {
                      "update_id": 123456,
                      "message": {
                        "text": "hello",
                        "chat": { "id": 42, "type": "private" },
                        "from": { "id": 7, "username": "jane", "is_bot": false }
                      }
                    }
                  ]
                }
                """;

        TelegramUpdatesResponse response = objectMapper.readValue(json, TelegramUpdatesResponse.class);

        assertThat(response.ok()).isTrue();
        assertThat(response.result()).hasSize(1);

        TelegramUpdate update = response.result().get(0);
        assertThat(update.updateId()).isEqualTo(123456L);

        TelegramMessage message = update.message();
        assertThat(message.text()).isEqualTo("hello");
        assertThat(message.chat()).isEqualTo(new TelegramChat(42L));
        assertThat(message.from()).isEqualTo(new TelegramUser(7L, "jane"));
    }

    @Test
    void deserializesEmptyResultList() throws Exception {
        TelegramUpdatesResponse response = objectMapper.readValue(
                "{\"ok\": true, \"result\": []}", TelegramUpdatesResponse.class
        );

        assertThat(response.result()).isEmpty();
    }
}
