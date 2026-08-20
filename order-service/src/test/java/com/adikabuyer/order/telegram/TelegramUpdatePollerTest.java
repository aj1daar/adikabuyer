package com.adikabuyer.order.telegram;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TelegramUpdatePollerTest {

    @Mock
    private TelegramApiClient telegramApiClient;

    @Mock
    private TelegramAdminService telegramAdminService;

    @Mock
    private TelegramProperties telegramProperties;

    private TelegramUpdatePoller poller;

    @BeforeEach
    void setUp() {
        poller = new TelegramUpdatePoller(telegramApiClient, telegramAdminService, telegramProperties);
    }

    @Test
    void start_doesNotPoll_whenBotTokenNotConfigured() {
        when(telegramProperties.isConfigured()).thenReturn(false);

        poller.start();

        verifyNoInteractions(telegramApiClient);
        verifyNoInteractions(telegramAdminService);
    }

    @Test
    void handleUpdate_doesNothing_whenMessageIsNull() {
        poller.handleUpdate(new TelegramUpdate(1L, null));

        verifyNoInteractions(telegramApiClient, telegramAdminService);
    }

    @Test
    void handleUpdate_doesNothing_whenChatIsNull() {
        poller.handleUpdate(new TelegramUpdate(1L, new TelegramMessage(null, null, "hi")));

        verifyNoInteractions(telegramApiClient, telegramAdminService);
    }

    @Test
    void handleUpdate_unregistersAndConfirms_whenStopCommandSentByRegisteredAdmin() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "/stop");
        when(telegramAdminService.unregister(42L)).thenReturn(true);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramAdminService).unregister(42L);
        verify(telegramApiClient).sendMessage(42L, "Вы отключены от уведомлений о заказах Adika Buyer.");
    }

    @Test
    void handleUpdate_stopCommandIsCaseInsensitive() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, " /STOP ");
        when(telegramAdminService.unregister(42L)).thenReturn(true);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramAdminService).unregister(42L);
    }

    @Test
    void handleUpdate_tellsUnregisteredChat_whenStopCommandSentWithoutSubscription() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "/stop");
        when(telegramAdminService.unregister(42L)).thenReturn(false);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient).sendMessage(42L, "Вы и так не подписаны на уведомления.");
    }

    @Test
    void handleUpdate_confirmsConnection_whenPasswordMatches() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), new TelegramUser(7L, "jane"), "secret");
        when(telegramAdminService.tryRegister(42L, "jane", "secret")).thenReturn(true);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient).sendMessage(42L, "Вы подключены к уведомлениям о заказах Adika Buyer.");
    }

    @Test
    void handleUpdate_promptsForPassword_whenStartCommandSent() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "/start");
        when(telegramAdminService.tryRegister(42L, null, "/start")).thenReturn(false);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient).sendMessage(42L, "Отправьте пароль администратора, чтобы получать уведомления о новых заказах.");
    }

    @Test
    void handleUpdate_doesNothing_whenTextIsUnrecognizedAndPasswordDoesNotMatch() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "hello there");
        when(telegramAdminService.tryRegister(42L, null, "hello there")).thenReturn(false);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient, never()).sendMessage(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void pollLoop_processesUpdateAndAdvancesOffset_thenStops() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "/start");
        TelegramUpdate update = new TelegramUpdate(99L, message);
        when(telegramApiClient.getUpdates(0, 25)).thenAnswer(invocation -> {
            poller.stop();
            return List.of(update);
        });
        when(telegramAdminService.tryRegister(42L, null, "/start")).thenReturn(false);

        poller.pollLoop();

        verify(telegramApiClient).sendMessage(42L, "Отправьте пароль администратора, чтобы получать уведомления о новых заказах.");
        verify(telegramApiClient, never()).getUpdates(100, 25);
    }

    @Test
    void pollLoop_stopsQuietly_whenGetUpdatesThrowsWhileStopping() {
        when(telegramApiClient.getUpdates(0, 25)).thenAnswer(invocation -> {
            poller.stop();
            throw new RuntimeException("network blip");
        });

        poller.pollLoop();

        verify(telegramApiClient, never()).sendMessage(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void handleUpdate_toleratesNullText() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, null);
        when(telegramAdminService.tryRegister(42L, null, null)).thenReturn(false);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient, never()).sendMessage(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyString());
    }
}
