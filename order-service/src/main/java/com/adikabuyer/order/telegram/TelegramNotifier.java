package com.adikabuyer.order.telegram;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramNotifier {

    private final TelegramApiClient telegramApiClient;
    private final TelegramAdminService telegramAdminService;
    private final TelegramProperties telegramProperties;

    public void notifyAdmins(String message) {
        if (!telegramProperties.isConfigured()) {
            return;
        }
        for (Long chatId : telegramAdminService.getAdminChatIds()) {
            try {
                telegramApiClient.sendMessage(chatId, message);
            } catch (Exception e) {
                log.warn("Failed to notify telegram admin chat {}", chatId, e);
            }
        }
    }
}
