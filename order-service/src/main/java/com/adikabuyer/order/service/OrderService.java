package com.adikabuyer.order.service;

import com.adikabuyer.order.client.CatalogClient;
import com.adikabuyer.order.config.DeliveryFeeProperties;
import com.adikabuyer.order.domain.Order;
import com.adikabuyer.order.domain.OrderItem;
import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CartItemDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.OrderItemDto;
import com.adikabuyer.order.dto.OrderPlacedEvent;
import com.adikabuyer.order.dto.VariantPricing;
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
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    /** Region value the cart sends when the customer collects the order instead of a courier. */
    private static final String PICKUP = "самовывоз";
    private static final String STATUS_SOLD_OUT = "SOLD_OUT";
    private static final String STATUS_PRE_ORDER = "PRE_ORDER";

    private final OrderRepository orderRepository;
    private final RabbitTemplate rabbitTemplate;
    private final DeliveryFeeProperties deliveryFeeProperties;
    private final TelegramNotifier telegramNotifier;
    private final CatalogClient catalogClient;

    @Value("${app.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key}")
    private String routingKey;

    @Transactional
    public CheckoutResponseDto checkout(CartDto cart) {
        // Never trust the client's prices/names/SKUs — re-resolve every line against
        // catalog-service and reject anything unknown, inactive or out of stock.
        List<CartItemDto> items = repriceAgainstCatalog(cart.items());

        BigDecimal itemsTotal = calculateItemsTotal(items);
        BigDecimal deliveryFee = resolveDeliveryFee(cart.region());
        BigDecimal grandTotal = itemsTotal.add(deliveryFee);
        String orderId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        Order order = buildOrder(orderId, cart, items, itemsTotal, deliveryFee, grandTotal, now);
        orderRepository.save(order);

        OrderPlacedEvent event = new OrderPlacedEvent(
                orderId,
                cart.customerName(),
                cart.customerPhone(),
                cart.region(),
                items,
                itemsTotal,
                deliveryFee,
                grandTotal,
                now
        );
        rabbitTemplate.convertAndSend(exchangeName, routingKey, event);

        String message = OrderNotificationMessageBuilder.buildOrderMessage(orderId, cart, items, itemsTotal, deliveryFee, grandTotal);
        try {
            telegramNotifier.notifyAdmins(message);
        } catch (Exception e) {
            log.warn("Failed to send telegram notification for order {}", orderId, e);
        }

        return new CheckoutResponseDto(orderId, itemsTotal, deliveryFee, grandTotal);
    }

    private List<CartItemDto> repriceAgainstCatalog(List<CartItemDto> requested) {
        Set<Long> variantIds = requested.stream().map(CartItemDto::variantId).collect(Collectors.toSet());
        Map<Long, VariantPricing> pricing = catalogClient.fetchPricing(variantIds);

        List<CartItemDto> priced = new ArrayList<>();
        for (CartItemDto item : requested) {
            VariantPricing variant = pricing.get(item.variantId());
            if (variant == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown variant: " + item.variantId());
            }
            if (!Boolean.TRUE.equals(variant.active()) || STATUS_SOLD_OUT.equals(variant.status())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Variant is no longer available: " + item.variantId());
            }
            boolean stockChecked = !STATUS_PRE_ORDER.equals(variant.status());
            if (stockChecked && (variant.stockQuantity() == null || variant.stockQuantity() < item.quantity())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough stock for variant: " + item.variantId());
            }
            priced.add(new CartItemDto(
                    item.variantId(),
                    variant.productName(),
                    variant.sku(),
                    item.attributes(),
                    variant.unitPrice(),
                    item.quantity()
            ));
        }
        return priced;
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
            String orderId, CartDto cart, List<CartItemDto> items,
            BigDecimal itemsTotal, BigDecimal deliveryFee, BigDecimal grandTotal, Instant now
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

        for (CartItemDto item : items) {
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

    private BigDecimal calculateItemsTotal(List<CartItemDto> items) {
        return items.stream()
                .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * The shop delivers inside Bishkek only, so the fee is binary: nothing when the
     * customer collects the order, the flat city rate otherwise. Historical orders keep
     * whatever region they were placed with — this only prices new ones.
     */
    private BigDecimal resolveDeliveryFee(String region) {
        if (region != null && region.strip().equalsIgnoreCase(PICKUP)) {
            return deliveryFeeProperties.getPickupFee();
        }
        return deliveryFeeProperties.getBishkekFee();
    }
}
