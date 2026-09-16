package com.adikabuyer.order.telegram;

import com.adikabuyer.order.domain.OrderStatus;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.OrderUpdateRequest;
import com.adikabuyer.order.service.OrderService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelegramUpdatePoller {

    private static final String CONNECTED_MESSAGE =
            "Вы подключены к уведомлениям о заказах Adika Buyer.";
    private static final String PROMPT_MESSAGE =
            "Отправьте пароль администратора, чтобы получать уведомления о новых заказах.";
    private static final String DISCONNECTED_MESSAGE =
            "Вы отключены от уведомлений о заказах Adika Buyer.";
    private static final String NOT_REGISTERED_MESSAGE =
            "Вы и так не подписаны на уведомления.";
    private static final String NEW_ADMIN_ALERT =
            "К уведомлениям о заказах подключился новый чат: %s (id %d). "
                    + "Если это не ваш коллега — смените пароль регистрации бота и отключите этот чат.";

    private final TelegramApiClient telegramApiClient;
    private final TelegramAdminService telegramAdminService;
    private final TelegramProperties telegramProperties;
    private final OrderService orderService;

    private volatile boolean running = true;
    private Thread pollingThread;
    private long offset = 0;

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!telegramProperties.isConfigured()) {
            log.info("Telegram bot token not configured, skipping update polling");
            return;
        }
        pollingThread = new Thread(this::pollLoop, "telegram-update-poller");
        pollingThread.setDaemon(true);
        pollingThread.start();
    }

    @PreDestroy
    public void stop() {
        running = false;
        if (pollingThread != null) {
            pollingThread.interrupt();
        }
    }

    void pollLoop() {
        while (running) {
            try {
                List<TelegramUpdate> updates = telegramApiClient.getUpdates(offset, 25);
                for (TelegramUpdate update : updates) {
                    offset = update.updateId() + 1;
                    handleUpdate(update);
                }
            } catch (Exception e) {
                if (running) {
                    log.warn("Telegram polling error, retrying shortly", e);
                    sleepQuietly(5000);
                }
            }
        }
    }

    void handleUpdate(TelegramUpdate update) {
        if (update.callbackQuery() != null) {
            handleCallback(update.callbackQuery());
            return;
        }
        TelegramMessage message = update.message();
        if (message == null || message.chat() == null) {
            return;
        }
        long chatId = message.chat().id();
        String username = message.from() != null ? message.from().username() : null;
        String text = message.text() != null ? message.text().strip() : null;

        if (text != null && text.equalsIgnoreCase("/stop")) {
            boolean removed = telegramAdminService.unregister(chatId);
            telegramApiClient.sendMessage(chatId, removed ? DISCONNECTED_MESSAGE : NOT_REGISTERED_MESSAGE);
            return;
        }

        TelegramAdminService.RegistrationResult result = telegramAdminService.tryRegister(chatId, username, message.text());
        if (result == TelegramAdminService.RegistrationResult.REGISTERED) {
            telegramApiClient.sendMessage(chatId, CONNECTED_MESSAGE);
            alertOtherAdmins(chatId, username);
        } else if (result == TelegramAdminService.RegistrationResult.ALREADY_REGISTERED) {
            telegramApiClient.sendMessage(chatId, CONNECTED_MESSAGE);
        } else if (text != null && text.equalsIgnoreCase("/start")) {
            telegramApiClient.sendMessage(chatId, PROMPT_MESSAGE);
        }
    }

    /**
     * A tap on "Подтвердить"/"Отменить" under an order message. Only registered admin chats
     * can act; the change goes through OrderService, so the transition rules and the stock
     * return on cancel are exactly the admin panel's. The message is rewritten with the
     * outcome and loses its buttons so nobody taps them twice.
     */
    void handleCallback(TelegramCallbackQuery query) {
        TelegramMessage message = query.message();
        if (message == null || message.chat() == null) {
            return;
        }
        long chatId = message.chat().id();
        if (!telegramAdminService.isAdminChat(chatId)) {
            telegramApiClient.answerCallbackQuery(query.id(), "Нет доступа");
            return;
        }
        String[] parts = query.data() == null ? new String[0] : query.data().split(":");
        OrderStatus status = parts.length == 3 && parts[0].equals("order") ? parseStatus(parts[2]) : null;
        if (status == null) {
            telegramApiClient.answerCallbackQuery(query.id(), "Неизвестная команда");
            return;
        }
        try {
            OrderDto order = orderService.updateOrder(parts[1], new OrderUpdateRequest(status));
            String who = query.from() != null && query.from().username() != null ? " — @" + query.from().username() : "";
            telegramApiClient.answerCallbackQuery(query.id(), "Заказ №" + order.number() + ": " + status.label());
            if (message.messageId() != null) {
                telegramApiClient.editMessageText(chatId, message.messageId(),
                        message.text() + "\n\nСтатус: " + status.label() + who);
            }
        } catch (ResponseStatusException e) {
            int code = e.getStatusCode().value();
            telegramApiClient.answerCallbackQuery(query.id(),
                    code == 404 ? "Заказ не найден — возможно, удалён" : "Нельзя: заказ уже обработан");
        }
    }

    private static OrderStatus parseStatus(String value) {
        try {
            return OrderStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** Every new subscriber receives customer names and phones, so the existing admins hear about it. */
    private void alertOtherAdmins(long newChatId, String username) {
        String who = username != null && !username.isBlank() ? "@" + username : "без имени пользователя";
        String alert = NEW_ADMIN_ALERT.formatted(who, newChatId);
        for (Long adminChatId : telegramAdminService.getAdminChatIds()) {
            if (adminChatId == newChatId) {
                continue;
            }
            try {
                telegramApiClient.sendMessage(adminChatId, alert);
            } catch (Exception e) {
                log.warn("Failed to alert telegram admin chat {} about new registration", adminChatId, e);
            }
        }
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
