package com.adikabuyer.order.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "telegram_admin")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelegramAdmin {

    @Id
    @Column(name = "chat_id")
    private Long chatId;

    private String username;

    @Column(name = "registered_at", nullable = false)
    private Instant registeredAt;
}
