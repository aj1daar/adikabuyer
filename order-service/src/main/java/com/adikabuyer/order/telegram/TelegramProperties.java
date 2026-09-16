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
    /** Public admin panel URL for the "Открыть админку" button; only used when it is https. */
    private String adminUrl = "";

    /** Telegram rejects buttons pointing at http or localhost, and would drop the whole message. */
    public boolean hasUsableAdminUrl() {
        return adminUrl != null && adminUrl.startsWith("https://") && !adminUrl.contains("://localhost");
    }

    public boolean isConfigured() {
        return botToken != null && !botToken.isBlank();
    }
}
