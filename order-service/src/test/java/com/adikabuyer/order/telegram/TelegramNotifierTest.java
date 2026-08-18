package com.adikabuyer.order.telegram;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TelegramNotifierTest {

    @Mock
    private TelegramApiClient telegramApiClient;

    @Mock
    private TelegramAdminService telegramAdminService;

    private TelegramProperties telegramProperties;
    private TelegramNotifier telegramNotifier;

    @BeforeEach
    void setUp() {
        telegramProperties = new TelegramProperties();
        telegramNotifier = new TelegramNotifier(telegramApiClient, telegramAdminService, telegramProperties);
    }

    @Test
    void notifyAdmins_doesNothing_whenBotTokenIsNotConfigured() {
        telegramProperties.setBotToken("");

        telegramNotifier.notifyAdmins("hello");

        verify(telegramAdminService, never()).getAdminChatIds();
    }

    @Test
    void notifyAdmins_sendsMessageToEveryRegisteredAdmin() {
        telegramProperties.setBotToken("real-token");
        when(telegramAdminService.getAdminChatIds()).thenReturn(List.of(1L, 2L));

        telegramNotifier.notifyAdmins("hello");

        verify(telegramApiClient).sendMessage(1L, "hello");
        verify(telegramApiClient).sendMessage(2L, "hello");
    }

    @Test
    void notifyAdmins_continuesToRemainingAdmins_whenOneSendFails() {
        telegramProperties.setBotToken("real-token");
        when(telegramAdminService.getAdminChatIds()).thenReturn(List.of(1L, 2L));
        org.mockito.Mockito.doThrow(new RuntimeException("network error"))
                .when(telegramApiClient).sendMessage(1L, "hello");

        telegramNotifier.notifyAdmins("hello");

        verify(telegramApiClient).sendMessage(2L, "hello");
    }
}
