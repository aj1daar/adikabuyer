package com.adikabuyer.order.service;

import com.adikabuyer.order.config.DeliveryFeeProperties;
import com.adikabuyer.order.domain.Order;
import com.adikabuyer.order.domain.OrderItem;
import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CartItemDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.OrderItemDto;
import com.adikabuyer.order.dto.OrderPlacedEvent;
import com.adikabuyer.order.repository.OrderRepository;
import com.adikabuyer.order.telegram.OrderNotificationMessageBuilder;
import com.adikabuyer.order.telegram.TelegramNotifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final String BISHKEK = "бишкек";

    private final OrderRepository orderRepository;
    private final RabbitTemplate rabbitTemplate;
    private final DeliveryFeeProperties deliveryFeeProperties;
    private final TelegramNotifier telegramNotifier;

    @Value("${app.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key}")
    private String routingKey;

    @Transactional
    public CheckoutResponseDto checkout(CartDto cart) {
        BigDecimal itemsTotal = calculateItemsTotal(cart);
        BigDecimal deliveryFee = resolveDeliveryFee(cart.region());
        BigDecimal grandTotal = itemsTotal.add(deliveryFee);
        String orderId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        Order order = buildOrder(orderId, cart, itemsTotal, deliveryFee, grandTotal, now);
        orderRepository.save(order);

        OrderPlacedEvent event = new OrderPlacedEvent(
                orderId,
                cart.customerName(),
                cart.customerPhone(),
                cart.region(),
                cart.items(),
                itemsTotal,
                deliveryFee,
                grandTotal,
                now
        );
        rabbitTemplate.convertAndSend(exchangeName, routingKey, event);

        String message = OrderNotificationMessageBuilder.buildOrderMessage(orderId, cart, itemsTotal, deliveryFee, grandTotal);
        try {
            telegramNotifier.notifyAdmins(message);
        } catch (Exception e) {
            log.warn("Failed to send telegram notification for order {}", orderId, e);
        }

        return new CheckoutResponseDto(orderId, itemsTotal, deliveryFee, grandTotal);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void deleteOrder(String id) {
        if (!orderRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found: " + id);
        }
        orderRepository.deleteById(id);
    }

    private Order buildOrder(
            String orderId, CartDto cart, BigDecimal itemsTotal, BigDecimal deliveryFee, BigDecimal grandTotal, Instant now
    ) {
        Order order = Order.builder()
                .id(orderId)
                .customerName(cart.customerName())
                .customerPhone(cart.customerPhone())
                .region(cart.region())
                .itemsTotal(itemsTotal)
                .deliveryFee(deliveryFee)
                .grandTotal(grandTotal)
                .createdAt(now)
                .items(new ArrayList<>())
                .build();

        for (CartItemDto item : cart.items()) {
            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .variantId(item.variantId())
                    .productName(item.productName())
                    .sku(item.sku())
                    .attributes(item.attributes() != null ? item.attributes() : new java.util.HashMap<>())
                    .unitPrice(item.unitPrice())
                    .quantity(item.quantity())
                    .build());
        }

        return order;
    }

    private OrderDto toDto(Order order) {
        List<OrderItemDto> items = order.getItems().stream()
                .map(item -> new OrderItemDto(
                        item.getVariantId(),
                        item.getProductName(),
                        item.getSku(),
                        item.getAttributes(),
                        item.getUnitPrice(),
                        item.getQuantity()
                ))
                .toList();

        return new OrderDto(
                order.getId(),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getRegion(),
                order.getItemsTotal(),
                order.getDeliveryFee(),
                order.getGrandTotal(),
                order.getCreatedAt(),
                items
        );
    }

    private BigDecimal calculateItemsTotal(CartDto cart) {
        return cart.items().stream()
                .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal resolveDeliveryFee(String region) {
        if (region != null && region.strip().equalsIgnoreCase(BISHKEK)) {
            return deliveryFeeProperties.getBishkekFee();
        }
        return deliveryFeeProperties.getDefaultFee();
    }
}
