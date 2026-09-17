package com.adikabuyer.order.telegram;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramNotifier {

    private final TelegramApiClient telegramApiClient;
    private final TelegramAdminService telegramAdminService;
    private final TelegramProperties telegramProperties;

    public void notifyAdmins(String message) {
        notifyAdmins(message, List.of());
    }

    public void notifyAdmins(String message, List<List<InlineButton>> keyboard) {
        if (!telegramProperties.isConfigured()) {
            return;
        }
        for (Long chatId : telegramAdminService.getAdminChatIds()) {
            try {
                if (keyboard == null || keyboard.isEmpty()) {
                    telegramApiClient.sendMessage(chatId, message);
                } else {
                    telegramApiClient.sendMessage(chatId, message, keyboard);
                }
            } catch (Exception e) {
                log.warn("Failed to notify telegram admin chat {}", chatId, e);
            }
        }
    }
}
