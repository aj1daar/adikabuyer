package com.adikabuyer.order.config;

import com.adikabuyer.order.telegram.TelegramProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class TelegramConfig {

    @Bean
    public RestClient telegramRestClient(TelegramProperties telegramProperties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(40));

        return RestClient.builder()
                .baseUrl("https://api.telegram.org/bot" + telegramProperties.getBotToken())
                .requestFactory(requestFactory)
                .build();
    }
}
