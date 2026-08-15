package com.adikabuyer.order.service;

import com.adikabuyer.order.config.DeliveryFeeProperties;
import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CartItemDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final RabbitTemplate rabbitTemplate;
    private final DeliveryFeeProperties deliveryFeeProperties;

    @Value("${app.whatsapp.store-phone-number}")
    private String storePhoneNumber;

    @Value("${app.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key}")
    private String routingKey;

    public CheckoutResponseDto checkout(CartDto cart) {
        BigDecimal itemsTotal = calculateItemsTotal(cart);
        BigDecimal deliveryFee = resolveDeliveryFee(cart.region());
        BigDecimal grandTotal = itemsTotal.add(deliveryFee);
        String orderId = UUID.randomUUID().toString();

        OrderPlacedEvent event = new OrderPlacedEvent(
                orderId,
                cart.customerName(),
                cart.customerPhone(),
                cart.region(),
                cart.items(),
                itemsTotal,
                deliveryFee,
                grandTotal,
                Instant.now()
        );
        rabbitTemplate.convertAndSend(exchangeName, routingKey, event);

        String whatsappUrl = buildWhatsappUrl(orderId, cart, itemsTotal, deliveryFee, grandTotal);
        return new CheckoutResponseDto(orderId, itemsTotal, deliveryFee, grandTotal, whatsappUrl);
    }

    private BigDecimal calculateItemsTotal(CartDto cart) {
        return cart.items().stream()
                .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal resolveDeliveryFee(String region) {
        if (region == null) {
            return deliveryFeeProperties.getDefaultFee();
        }
        return deliveryFeeProperties.getFees().getOrDefault(region.toLowerCase(), deliveryFeeProperties.getDefaultFee());
    }

    private String buildWhatsappUrl(String orderId, CartDto cart, BigDecimal itemsTotal, BigDecimal deliveryFee, BigDecimal grandTotal) {
        StringBuilder message = new StringBuilder();
        message.append("New Order ").append(orderId).append('\n');
        message.append("Customer: ").append(cart.customerName()).append('\n');
        message.append("Phone: ").append(cart.customerPhone()).append('\n');
        message.append("Region: ").append(cart.region()).append("\n\n");

        for (CartItemDto item : cart.items()) {
            BigDecimal lineTotal = item.unitPrice().multiply(BigDecimal.valueOf(item.quantity()));
            message.append(item.quantity()).append("x ").append(item.productName())
                    .append(" (").append(item.sku()).append(") - ")
                    .append(lineTotal).append('\n');
        }

        message.append('\n').append("Items total: ").append(itemsTotal).append('\n');
        message.append("Delivery fee: ").append(deliveryFee).append('\n');
        message.append("Grand total: ").append(grandTotal);

        String encodedMessage = URLEncoder.encode(message.toString(), StandardCharsets.UTF_8);
        return "https://wa.me/" + storePhoneNumber + "?text=" + encodedMessage;
    }
}
