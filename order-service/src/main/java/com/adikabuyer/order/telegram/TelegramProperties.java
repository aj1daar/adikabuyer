package com.adikabuyer.order.telegram;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.telegram")
@Getter
@Setter
public class TelegramProperties {

    private String botToken = "";
    private String registrationPassword = "";

    public boolean isConfigured() {
        return botToken != null && !botToken.isBlank();
    }
}
