package com.adikabuyer.order.telegram;

import com.adikabuyer.order.domain.TelegramAdmin;
import com.adikabuyer.order.dto.TelegramAdminDto;
import com.adikabuyer.order.repository.TelegramAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TelegramAdminService {

    public enum RegistrationResult {
        /** The chat was just added to the admin list. */
        REGISTERED,
        /** The password matched a chat that was already subscribed. */
        ALREADY_REGISTERED,
        REJECTED
    }

    private final TelegramAdminRepository telegramAdminRepository;
    private final TelegramProperties telegramProperties;
    private final RegistrationAttemptLimiter registrationAttemptLimiter;

    @Transactional
    public RegistrationResult tryRegister(long chatId, String username, String messageText) {
        String password = telegramProperties.getRegistrationPassword();
        if (password == null || password.isBlank() || messageText == null) {
            return RegistrationResult.REJECTED;
        }
        String candidate = messageText.strip();
        // Bot commands (/start, /help, ...) are never password guesses, so they don't burn attempts.
        if (candidate.startsWith("/") || !registrationAttemptLimiter.tryAcquire(chatId)) {
            return RegistrationResult.REJECTED;
        }
        if (!MessageDigest.isEqual(candidate.getBytes(StandardCharsets.UTF_8), password.getBytes(StandardCharsets.UTF_8))) {
            return RegistrationResult.REJECTED;
        }

        if (telegramAdminRepository.existsById(chatId)) {
            return RegistrationResult.ALREADY_REGISTERED;
        }
        telegramAdminRepository.save(TelegramAdmin.builder()
                .chatId(chatId)
                .username(username)
                .registeredAt(Instant.now())
                .build());
        return RegistrationResult.REGISTERED;
    }

    @Transactional
    public boolean unregister(long chatId) {
        if (!telegramAdminRepository.existsById(chatId)) {
            return false;
        }
        telegramAdminRepository.deleteById(chatId);
        return true;
    }

    public boolean isAdminChat(long chatId) {
        return telegramAdminRepository.existsById(chatId);
    }

    public List<Long> getAdminChatIds() {
        return telegramAdminRepository.findAll().stream().map(TelegramAdmin::getChatId).toList();
    }

    public List<TelegramAdminDto> listAdmins() {
        return telegramAdminRepository.findAllByOrderByRegisteredAtDesc().stream()
                .map(admin -> new TelegramAdminDto(admin.getChatId(), admin.getUsername(), admin.getRegisteredAt()))
                .toList();
    }
}
