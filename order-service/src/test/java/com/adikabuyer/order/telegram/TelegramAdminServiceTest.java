package com.adikabuyer.order.telegram;

import com.adikabuyer.order.domain.TelegramAdmin;
import com.adikabuyer.order.dto.TelegramAdminDto;
import com.adikabuyer.order.repository.TelegramAdminRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static com.adikabuyer.order.telegram.TelegramAdminService.RegistrationResult.ALREADY_REGISTERED;
import static com.adikabuyer.order.telegram.TelegramAdminService.RegistrationResult.REGISTERED;
import static com.adikabuyer.order.telegram.TelegramAdminService.RegistrationResult.REJECTED;
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
        telegramAdminService = new TelegramAdminService(telegramAdminRepository, telegramProperties, new RegistrationAttemptLimiter(5, 30, 3600));
    }

    @Test
    void tryRegister_savesNewAdmin_whenPasswordMatches() {
        when(telegramAdminRepository.existsById(42L)).thenReturn(false);

        TelegramAdminService.RegistrationResult result = telegramAdminService.tryRegister(42L, "john", "secret123");

        assertThat(result).isEqualTo(REGISTERED);
        ArgumentCaptor<TelegramAdmin> captor = ArgumentCaptor.forClass(TelegramAdmin.class);
        verify(telegramAdminRepository).save(captor.capture());
        assertThat(captor.getValue().getChatId()).isEqualTo(42L);
        assertThat(captor.getValue().getUsername()).isEqualTo("john");
    }

    @Test
    void tryRegister_trimsWhitespace_beforeMatching() {
        when(telegramAdminRepository.existsById(1L)).thenReturn(false);

        assertThat(telegramAdminService.tryRegister(1L, "john", "  secret123  ")).isEqualTo(REGISTERED);
    }

    @Test
    void tryRegister_returnsFalse_whenPasswordDoesNotMatch() {
        TelegramAdminService.RegistrationResult result = telegramAdminService.tryRegister(42L, "john", "wrong-password");

        assertThat(result).isEqualTo(REJECTED);
        verify(telegramAdminRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void tryRegister_returnsFalse_whenMessageTextIsNull() {
        assertThat(telegramAdminService.tryRegister(42L, "john", null)).isEqualTo(REJECTED);
    }

    @Test
    void tryRegister_returnsFalse_whenRegistrationPasswordIsNotConfigured() {
        telegramProperties.setRegistrationPassword("");

        assertThat(telegramAdminService.tryRegister(42L, "john", "")).isEqualTo(REJECTED);
    }

    @Test
    void tryRegister_isIdempotent_whenAlreadyRegistered() {
        when(telegramAdminRepository.existsById(42L)).thenReturn(true);

        TelegramAdminService.RegistrationResult result = telegramAdminService.tryRegister(42L, "john", "secret123");

        assertThat(result).isEqualTo(ALREADY_REGISTERED);
        verify(telegramAdminRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void tryRegister_locksTheChatOut_afterFiveWrongGuesses_evenForTheRightPassword() {
        for (int i = 0; i < 5; i++) {
            assertThat(telegramAdminService.tryRegister(42L, "attacker", "guess-" + i)).isEqualTo(REJECTED);
        }

        assertThat(telegramAdminService.tryRegister(42L, "attacker", "secret123")).isEqualTo(REJECTED);
        verify(telegramAdminRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void tryRegister_stopsAllRegistrations_onceTheGlobalCapIsSpentAcrossManyChats() {
        for (long chat = 1; chat <= 30; chat++) {
            telegramAdminService.tryRegister(chat, null, "guess");
        }

        assertThat(telegramAdminService.tryRegister(999L, "late", "secret123")).isEqualTo(REJECTED);
    }

    @Test
    void tryRegister_doesNotCountBotCommands_asPasswordGuesses() {
        when(telegramAdminRepository.existsById(42L)).thenReturn(false);
        for (int i = 0; i < 10; i++) {
            assertThat(telegramAdminService.tryRegister(42L, "john", "/start")).isEqualTo(REJECTED);
        }

        assertThat(telegramAdminService.tryRegister(42L, "john", "secret123")).isEqualTo(REGISTERED);
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

    @Test
    void listAdmins_returnsDtosOrderedByRepository() {
        Instant registeredAt = Instant.parse("2026-01-01T00:00:00Z");
        when(telegramAdminRepository.findAllByOrderByRegisteredAtDesc()).thenReturn(List.of(
                TelegramAdmin.builder().chatId(42L).username("john").registeredAt(registeredAt).build()
        ));

        assertThat(telegramAdminService.listAdmins())
                .containsExactly(new TelegramAdminDto(42L, "john", registeredAt));
    }
}
