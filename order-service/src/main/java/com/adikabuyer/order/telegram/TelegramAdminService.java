package com.adikabuyer.order.telegram;

import com.adikabuyer.order.domain.TelegramAdmin;
import com.adikabuyer.order.dto.TelegramAdminDto;
import com.adikabuyer.order.repository.TelegramAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TelegramAdminService {

    private final TelegramAdminRepository telegramAdminRepository;
    private final TelegramProperties telegramProperties;

    @Transactional
    public boolean tryRegister(long chatId, String username, String messageText) {
        String password = telegramProperties.getRegistrationPassword();
        if (password == null || password.isBlank()) {
            return false;
        }
        if (messageText == null || !messageText.strip().equals(password)) {
            return false;
        }

        if (!telegramAdminRepository.existsById(chatId)) {
            telegramAdminRepository.save(TelegramAdmin.builder()
                    .chatId(chatId)
                    .username(username)
                    .registeredAt(Instant.now())
                    .build());
        }
        return true;
    }

    @Transactional
    public boolean unregister(long chatId) {
        if (!telegramAdminRepository.existsById(chatId)) {
            return false;
        }
        telegramAdminRepository.deleteById(chatId);
        return true;
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
