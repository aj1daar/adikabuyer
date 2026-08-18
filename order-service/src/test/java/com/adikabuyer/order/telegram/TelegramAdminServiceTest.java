package com.adikabuyer.order.telegram;

import com.adikabuyer.order.domain.TelegramAdmin;
import com.adikabuyer.order.repository.TelegramAdminRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TelegramAdminServiceTest {

    @Mock
    private TelegramAdminRepository telegramAdminRepository;

    private TelegramProperties telegramProperties;
    private TelegramAdminService telegramAdminService;

    @BeforeEach
    void setUp() {
        telegramProperties = new TelegramProperties();
        telegramProperties.setRegistrationPassword("secret123");
        telegramAdminService = new TelegramAdminService(telegramAdminRepository, telegramProperties);
    }

    @Test
    void tryRegister_savesNewAdmin_whenPasswordMatches() {
        when(telegramAdminRepository.existsById(42L)).thenReturn(false);

        boolean result = telegramAdminService.tryRegister(42L, "john", "secret123");

        assertThat(result).isTrue();
        ArgumentCaptor<TelegramAdmin> captor = ArgumentCaptor.forClass(TelegramAdmin.class);
        verify(telegramAdminRepository).save(captor.capture());
        assertThat(captor.getValue().getChatId()).isEqualTo(42L);
        assertThat(captor.getValue().getUsername()).isEqualTo("john");
    }

    @Test
    void tryRegister_trimsWhitespace_beforeMatching() {
        when(telegramAdminRepository.existsById(1L)).thenReturn(false);

        assertThat(telegramAdminService.tryRegister(1L, "john", "  secret123  ")).isTrue();
    }

    @Test
    void tryRegister_returnsFalse_whenPasswordDoesNotMatch() {
        boolean result = telegramAdminService.tryRegister(42L, "john", "wrong-password");

        assertThat(result).isFalse();
        verify(telegramAdminRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void tryRegister_returnsFalse_whenMessageTextIsNull() {
        assertThat(telegramAdminService.tryRegister(42L, "john", null)).isFalse();
    }

    @Test
    void tryRegister_returnsFalse_whenRegistrationPasswordIsNotConfigured() {
        telegramProperties.setRegistrationPassword("");

        assertThat(telegramAdminService.tryRegister(42L, "john", "")).isFalse();
    }

    @Test
    void tryRegister_isIdempotent_whenAlreadyRegistered() {
        when(telegramAdminRepository.existsById(42L)).thenReturn(true);

        boolean result = telegramAdminService.tryRegister(42L, "john", "secret123");

        assertThat(result).isTrue();
        verify(telegramAdminRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void unregister_deletesAndReturnsTrue_whenAdminExists() {
        when(telegramAdminRepository.existsById(42L)).thenReturn(true);

        assertThat(telegramAdminService.unregister(42L)).isTrue();
        verify(telegramAdminRepository).deleteById(42L);
    }

    @Test
    void unregister_returnsFalse_whenAdminDoesNotExist() {
        when(telegramAdminRepository.existsById(42L)).thenReturn(false);

        assertThat(telegramAdminService.unregister(42L)).isFalse();
        verify(telegramAdminRepository, never()).deleteById(org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void getAdminChatIds_returnsAllRegisteredChatIds() {
        when(telegramAdminRepository.findAll()).thenReturn(List.of(
                TelegramAdmin.builder().chatId(1L).build(),
                TelegramAdmin.builder().chatId(2L).build()
        ));

        assertThat(telegramAdminService.getAdminChatIds()).containsExactly(1L, 2L);
    }
}
