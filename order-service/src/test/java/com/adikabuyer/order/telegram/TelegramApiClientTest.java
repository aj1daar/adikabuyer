package com.adikabuyer.order.telegram;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class TelegramApiClientTest {

    private MockRestServiceServer mockServer;
    private TelegramApiClient telegramApiClient;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.baseUrl("https://api.telegram.org/bottest-token").build();
        telegramApiClient = new TelegramApiClient(restClient);
    }

    @Test
    void sendMessage_postsChatIdAndTextAsJson() {
        mockServer.expect(requestTo("https://api.telegram.org/bottest-token/sendMessage"))
                .andExpect(method(POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("{\"chat_id\":42,\"text\":\"hello\"}"))
                .andRespond(withSuccess());

        telegramApiClient.sendMessage(42L, "hello");

        mockServer.verify();
    }

    @Test
    void getUpdates_returnsResultList_whenResponseHasUpdates() {
        mockServer.expect(requestTo("https://api.telegram.org/bottest-token/getUpdates?offset=5&timeout=25"))
                .andExpect(method(GET))
                .andRespond(withSuccess("""
                        {"ok": true, "result": [{"update_id": 6, "message": {"chat": {"id": 42}, "text": "hi"}}]}
                        """, MediaType.APPLICATION_JSON));

        List<TelegramUpdate> updates = telegramApiClient.getUpdates(5, 25);

        assertThat(updates).hasSize(1);
        assertThat(updates.get(0).updateId()).isEqualTo(6L);
        assertThat(updates.get(0).message().chat().id()).isEqualTo(42L);
        mockServer.verify();
    }

    @Test
    void getUpdates_returnsEmptyList_whenResultIsNull() {
        mockServer.expect(requestTo("https://api.telegram.org/bottest-token/getUpdates?offset=0&timeout=25"))
                .andRespond(withSuccess("{\"ok\": true, \"result\": null}", MediaType.APPLICATION_JSON));

        List<TelegramUpdate> updates = telegramApiClient.getUpdates(0, 25);

        assertThat(updates).isEmpty();
    }
}
