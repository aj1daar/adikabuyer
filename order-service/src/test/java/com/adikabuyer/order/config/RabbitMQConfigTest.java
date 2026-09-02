package com.adikabuyer.order.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class RabbitMQConfigTest {

    private RabbitMQConfig rabbitMQConfig;

    @BeforeEach
    void setUp() {
        rabbitMQConfig = new RabbitMQConfig();
        ReflectionTestUtils.setField(rabbitMQConfig, "exchangeName", "order.exchange");
    }

    @Test
    void orderExchange_isNamedAndConfigured() {
        TopicExchange exchange = rabbitMQConfig.orderExchange();

        assertThat(exchange.getName()).isEqualTo("order.exchange");
    }

    @Test
    void jsonMessageConverter_isJacksonBased() {
        assertThat(rabbitMQConfig.jsonMessageConverter()).isInstanceOf(JacksonJsonMessageConverter.class);
    }
}
