package com.adikabuyer.order.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class RabbitMQConfigTest {

    private RabbitMQConfig rabbitMQConfig;

    @BeforeEach
    void setUp() {
        rabbitMQConfig = new RabbitMQConfig();
        ReflectionTestUtils.setField(rabbitMQConfig, "exchangeName", "order.exchange");
        ReflectionTestUtils.setField(rabbitMQConfig, "queueName", "order.queue");
        ReflectionTestUtils.setField(rabbitMQConfig, "routingKey", "order.new");
    }

    @Test
    void orderExchange_isNamedAndConfigured() {
        TopicExchange exchange = rabbitMQConfig.orderExchange();

        assertThat(exchange.getName()).isEqualTo("order.exchange");
    }

    @Test
    void orderQueue_isDurable() {
        Queue queue = rabbitMQConfig.orderQueue();

        assertThat(queue.getName()).isEqualTo("order.queue");
        assertThat(queue.isDurable()).isTrue();
    }

    @Test
    void orderBinding_bindsQueueToExchangeWithRoutingKey() {
        Queue queue = rabbitMQConfig.orderQueue();
        TopicExchange exchange = rabbitMQConfig.orderExchange();

        Binding binding = rabbitMQConfig.orderBinding(queue, exchange);

        assertThat(binding.getDestination()).isEqualTo("order.queue");
        assertThat(binding.getExchange()).isEqualTo("order.exchange");
        assertThat(binding.getRoutingKey()).isEqualTo("order.new");
    }

    @Test
    void jsonMessageConverter_isJacksonBased() {
        assertThat(rabbitMQConfig.jsonMessageConverter()).isInstanceOf(Jackson2JsonMessageConverter.class);
    }
}
