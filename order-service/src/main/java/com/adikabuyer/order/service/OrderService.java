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
import com.adikabuyer.order.telegram.TelegramNotifier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.TreeMap;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final char NBSP = ' ';
    private static final String DEFAULT_SKU_PREFIX = "DEFAULT-";

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

        String message = buildOrderMessage(orderId, cart, itemsTotal, deliveryFee, grandTotal);
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
        if (region == null) {
            return deliveryFeeProperties.getDefaultFee();
        }
        return deliveryFeeProperties.getFees().getOrDefault(region.strip().toLowerCase(), deliveryFeeProperties.getDefaultFee());
    }

    private String buildOrderMessage(String orderId, CartDto cart, BigDecimal itemsTotal, BigDecimal deliveryFee, BigDecimal grandTotal) {
        StringBuilder message = new StringBuilder();
        message.append("Новый заказ ").append(orderId).append('\n');
        message.append("Имя: ").append(cart.customerName()).append('\n');
        message.append("Телефон: ").append(cart.customerPhone()).append('\n');
        message.append("Город: ").append(cart.region()).append("\n\n");

        for (CartItemDto item : cart.items()) {
            message.append(buildItemLine(item)).append('\n');
        }

        message.append('\n').append("Товары: ").append(formatPrice(itemsTotal)).append('\n');
        message.append("Доставка: ").append(formatPrice(deliveryFee)).append('\n');
        message.append("Итого: ").append(formatPrice(grandTotal));

        return message.toString();
    }

    private String buildItemLine(CartItemDto item) {
        BigDecimal lineTotal = item.unitPrice().multiply(BigDecimal.valueOf(item.quantity()));
        StringBuilder line = new StringBuilder();
        line.append(item.quantity()).append("x ").append(item.productName());

        String details = describeVariant(item);
        if (!details.isEmpty()) {
            line.append(" (").append(details).append(')');
        }

        return line.append(" — ").append(formatPrice(lineTotal)).toString();
    }

    private String describeVariant(CartItemDto item) {
        List<String> parts = new ArrayList<>();
        if (item.attributes() != null) {
            new TreeMap<>(item.attributes()).values().stream()
                    .filter(Objects::nonNull)
                    .map(String::valueOf)
                    .forEach(parts::add);
        }
        if (item.sku() != null && !item.sku().startsWith(DEFAULT_SKU_PREFIX)) {
            parts.add(item.sku());
        }
        return String.join(", ", parts);
    }

    private String formatPrice(BigDecimal value) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.ROOT);
        symbols.setGroupingSeparator(NBSP);
        DecimalFormat format = new DecimalFormat("#,##0", symbols);
        format.setRoundingMode(RoundingMode.HALF_UP);
        return format.format(value) + NBSP + "KGS";
    }
}
