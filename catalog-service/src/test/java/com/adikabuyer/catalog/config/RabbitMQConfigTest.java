package com.adikabuyer.catalog.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
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
        ReflectionTestUtils.setField(rabbitMQConfig, "queueName", "order.queue");
        ReflectionTestUtils.setField(rabbitMQConfig, "routingKey", "order.new");
        ReflectionTestUtils.setField(rabbitMQConfig, "deadLetterExchangeName", "order.dlx");
        ReflectionTestUtils.setField(rabbitMQConfig, "deadLetterQueueName", "order.queue.dlq");
        ReflectionTestUtils.setField(rabbitMQConfig, "deadLetterRoutingKey", "order.new.dlq");
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
    void orderQueue_isConfiguredWithDeadLetterRouting() {
        Queue queue = rabbitMQConfig.orderQueue();

        assertThat(queue.getArguments()).containsEntry("x-dead-letter-exchange", "order.dlx");
        assertThat(queue.getArguments()).containsEntry("x-dead-letter-routing-key", "order.new.dlq");
    }

    @Test
    void deadLetterExchange_isNamedAndConfigured() {
        DirectExchange exchange = rabbitMQConfig.deadLetterExchange();

        assertThat(exchange.getName()).isEqualTo("order.dlx");
    }

    @Test
    void deadLetterQueue_isDurable() {
        Queue queue = rabbitMQConfig.deadLetterQueue();

        assertThat(queue.getName()).isEqualTo("order.queue.dlq");
        assertThat(queue.isDurable()).isTrue();
    }

    @Test
    void deadLetterBinding_bindsDeadLetterQueueToDeadLetterExchange() {
        Queue queue = rabbitMQConfig.deadLetterQueue();
        DirectExchange exchange = rabbitMQConfig.deadLetterExchange();

        Binding binding = rabbitMQConfig.deadLetterBinding(queue, exchange);

        assertThat(binding.getDestination()).isEqualTo("order.queue.dlq");
        assertThat(binding.getExchange()).isEqualTo("order.dlx");
        assertThat(binding.getRoutingKey()).isEqualTo("order.new.dlq");
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
        assertThat(rabbitMQConfig.jsonMessageConverter()).isInstanceOf(JacksonJsonMessageConverter.class);
    }
}
