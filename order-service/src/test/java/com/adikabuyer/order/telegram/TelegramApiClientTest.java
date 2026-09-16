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
    void sendMessage_withButtons_postsAnInlineKeyboard() {
        mockServer.expect(requestTo("https://api.telegram.org/bottest-token/sendMessage"))
                .andExpect(content().json("""
                        {"chat_id":42,"text":"hi","reply_markup":{"inline_keyboard":[
                          [{"text":"Ок","callback_data":"order:1:CONFIRMED"}],
                          [{"text":"Админка","url":"https://adikabuyer.kg/admin"}]
                        ]}}"""))
                .andRespond(withSuccess());

        telegramApiClient.sendMessage(42L, "hi", List.of(
                List.of(InlineButton.callback("Ок", "order:1:CONFIRMED")),
                List.of(InlineButton.link("Админка", "https://adikabuyer.kg/admin"))));

        mockServer.verify();
    }

    @Test
    void editMessageText_andAnswerCallbackQuery_callTheirEndpoints() {
        mockServer.expect(requestTo("https://api.telegram.org/bottest-token/editMessageText"))
                .andExpect(content().json("{\"chat_id\":42,\"message_id\":7,\"text\":\"done\"}"))
                .andRespond(withSuccess());
        mockServer.expect(requestTo("https://api.telegram.org/bottest-token/answerCallbackQuery"))
                .andExpect(content().json("{\"callback_query_id\":\"cb1\",\"text\":\"ok\"}"))
                .andRespond(withSuccess());

        telegramApiClient.editMessageText(42L, 7L, "done");
        telegramApiClient.answerCallbackQuery("cb1", "ok");

        mockServer.verify();
    }

    @Test
    void getUpdates_readsCallbackQueries() {
        mockServer.expect(requestTo("https://api.telegram.org/bottest-token/getUpdates?offset=0&timeout=25"))
                .andRespond(withSuccess("""
                        {"ok": true, "result": [{"update_id": 9, "callback_query": {"id": "cb1", "data": "order:1:CANCELLED",
                          "from": {"id": 5, "username": "jane"}, "message": {"message_id": 7, "chat": {"id": 42}, "text": "Новый заказ"}}}]}
                        """, MediaType.APPLICATION_JSON));

        TelegramCallbackQuery query = telegramApiClient.getUpdates(0, 25).get(0).callbackQuery();

        assertThat(query.data()).isEqualTo("order:1:CANCELLED");
        assertThat(query.message().messageId()).isEqualTo(7L);
        assertThat(query.message().chat().id()).isEqualTo(42L);
        assertThat(query.from().username()).isEqualTo("jane");
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
