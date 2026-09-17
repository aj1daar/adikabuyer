package com.adikabuyer.order.telegram;

import com.adikabuyer.order.domain.OrderStatus;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.OrderUpdateRequest;
import com.adikabuyer.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static com.adikabuyer.order.telegram.TelegramAdminService.RegistrationResult.ALREADY_REGISTERED;
import static com.adikabuyer.order.telegram.TelegramAdminService.RegistrationResult.REGISTERED;
import static com.adikabuyer.order.telegram.TelegramAdminService.RegistrationResult.REJECTED;

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

    @Mock
    private OrderService orderService;

    private TelegramUpdatePoller poller;

    @BeforeEach
    void setUp() {
        poller = new TelegramUpdatePoller(telegramApiClient, telegramAdminService, telegramProperties, orderService);
    }

    private TelegramUpdate tap(String data) {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "Новый заказ №1042", 7L);
        return new TelegramUpdate(1L, null, new TelegramCallbackQuery("cb1", new TelegramUser(5L, "jane"), message, data));
    }

    private OrderDto orderDto(OrderStatus status) {
        return new OrderDto("o1", 1042L, "Jane", "+996700000000", "Бишкек", java.math.BigDecimal.TEN, java.math.BigDecimal.ZERO,
                java.math.BigDecimal.TEN, java.time.Instant.now(), status, java.time.Instant.now(), null, null, null, List.of());
    }

    @Test
    void handleCallback_confirmsTheOrder_andRewritesTheMessageWithoutButtons() {
        when(telegramAdminService.isAdminChat(42L)).thenReturn(true);
        when(orderService.updateOrder("o1", new OrderUpdateRequest(OrderStatus.CONFIRMED))).thenReturn(orderDto(OrderStatus.CONFIRMED));

        poller.handleUpdate(tap("order:o1:CONFIRMED"));

        verify(telegramApiClient).answerCallbackQuery("cb1", "Заказ №1042: Подтверждён");
        verify(telegramApiClient).editMessageText(42L, 7L, "Новый заказ №1042\n\nСтатус: Подтверждён — @jane");
    }

    @Test
    void handleCallback_refusesChatsThatAreNotRegisteredAdmins() {
        when(telegramAdminService.isAdminChat(42L)).thenReturn(false);

        poller.handleUpdate(tap("order:o1:CANCELLED"));

        verify(telegramApiClient).answerCallbackQuery("cb1", "Нет доступа");
        verifyNoInteractions(orderService);
    }

    @Test
    void handleCallback_explainsWhenTheOrderWasAlreadyHandled() {
        when(telegramAdminService.isAdminChat(42L)).thenReturn(true);
        when(orderService.updateOrder("o1", new OrderUpdateRequest(OrderStatus.CANCELLED)))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Invalid status transition"));

        poller.handleUpdate(tap("order:o1:CANCELLED"));

        verify(telegramApiClient).answerCallbackQuery("cb1", "Нельзя: заказ уже обработан");
        verify(telegramApiClient, never()).editMessageText(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void handleCallback_ignoresMalformedButtonData() {
        when(telegramAdminService.isAdminChat(42L)).thenReturn(true);

        poller.handleUpdate(tap("order:o1:TELEPORT"));

        verify(telegramApiClient).answerCallbackQuery("cb1", "Неизвестная команда");
        verifyNoInteractions(orderService);
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
        when(telegramAdminService.tryRegister(42L, "jane", "secret")).thenReturn(REGISTERED);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient).sendMessage(42L, "Вы подключены к уведомлениям о заказах Adika Buyer.");
    }

    @Test
    void handleUpdate_alertsTheOtherAdmins_whenANewChatRegisters() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), new TelegramUser(7L, "jane"), "secret");
        when(telegramAdminService.tryRegister(42L, "jane", "secret")).thenReturn(REGISTERED);
        when(telegramAdminService.getAdminChatIds()).thenReturn(List.of(1L, 2L, 42L));

        poller.handleUpdate(new TelegramUpdate(1L, message));

        org.mockito.ArgumentCaptor<String> alert = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(telegramApiClient).sendMessage(org.mockito.ArgumentMatchers.eq(1L), alert.capture());
        verify(telegramApiClient).sendMessage(org.mockito.ArgumentMatchers.eq(2L), org.mockito.ArgumentMatchers.anyString());
        verify(telegramApiClient, never()).sendMessage(org.mockito.ArgumentMatchers.eq(42L), org.mockito.ArgumentMatchers.startsWith("К уведомлениям"));
        org.assertj.core.api.Assertions.assertThat(alert.getValue()).contains("@jane", "42");
    }

    @Test
    void handleUpdate_stillAlertsRemainingAdmins_whenOneAlertFails() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "secret");
        when(telegramAdminService.tryRegister(42L, null, "secret")).thenReturn(REGISTERED);
        when(telegramAdminService.getAdminChatIds()).thenReturn(List.of(1L, 2L));
        org.mockito.Mockito.lenient().doThrow(new RuntimeException("blocked by user"))
                .when(telegramApiClient).sendMessage(org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.anyString());

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient).sendMessage(org.mockito.ArgumentMatchers.eq(2L), org.mockito.ArgumentMatchers.contains("без имени"));
    }

    @Test
    void handleUpdate_confirmsWithoutAlerting_whenTheChatWasAlreadyRegistered() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "secret");
        when(telegramAdminService.tryRegister(42L, null, "secret")).thenReturn(ALREADY_REGISTERED);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient).sendMessage(42L, "Вы подключены к уведомлениям о заказах Adika Buyer.");
        verify(telegramAdminService, never()).getAdminChatIds();
    }

    @Test
    void handleUpdate_promptsForPassword_whenStartCommandSent() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "/start");
        when(telegramAdminService.tryRegister(42L, null, "/start")).thenReturn(REJECTED);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient).sendMessage(42L, "Отправьте пароль администратора, чтобы получать уведомления о новых заказах.");
    }

    @Test
    void handleUpdate_doesNothing_whenTextIsUnrecognizedAndPasswordDoesNotMatch() {
        TelegramMessage message = new TelegramMessage(new TelegramChat(42L), null, "hello there");
        when(telegramAdminService.tryRegister(42L, null, "hello there")).thenReturn(REJECTED);

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
        when(telegramAdminService.tryRegister(42L, null, "/start")).thenReturn(REJECTED);

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
        when(telegramAdminService.tryRegister(42L, null, null)).thenReturn(REJECTED);

        poller.handleUpdate(new TelegramUpdate(1L, message));

        verify(telegramApiClient, never()).sendMessage(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyString());
    }
}
