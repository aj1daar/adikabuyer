package com.adikabuyer.order.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * order-service is only a <em>producer</em> — it publishes to the exchange with a routing
 * key. The {@code order.queue} declaration (and its dead-letter arguments) is owned by
 * catalog-service, the consumer. Declaring the queue here too — with different arguments —
 * causes a {@code PRECONDITION_FAILED} on a fresh broker, so we don't.
 */
@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange}")
    private String exchangeName;

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
