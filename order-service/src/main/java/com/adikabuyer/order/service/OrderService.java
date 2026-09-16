package com.adikabuyer.order.service;

import com.adikabuyer.order.client.CatalogClient;
import com.adikabuyer.order.config.DeliveryFeeProperties;
import com.adikabuyer.order.domain.Order;
import com.adikabuyer.order.domain.OrderItem;
import com.adikabuyer.order.domain.OrderStatus;
import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CartItemDto;
import com.adikabuyer.order.dto.OrderCancelledEvent;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.OrderItemDto;
import com.adikabuyer.order.dto.OrderPlacedEvent;
import com.adikabuyer.order.dto.OrderUpdateRequest;
import com.adikabuyer.order.dto.VariantPricing;
import com.adikabuyer.order.repository.OrderRepository;
import com.adikabuyer.order.telegram.InlineButton;
import com.adikabuyer.order.telegram.OrderNotificationMessageBuilder;
import com.adikabuyer.order.telegram.TelegramNotifier;
import com.adikabuyer.order.telegram.TelegramProperties;
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
    private final TelegramProperties telegramProperties;

    @Value("${app.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key}")
    private String routingKey;

    @Value("${app.rabbitmq.cancel-routing-key}")
    private String cancelRoutingKey;

    @Transactional
    public CheckoutResponseDto checkout(CartDto submitted) {
        CartDto cart = sanitize(submitted);
        // Never trust the client's prices/names/SKUs/attributes — re-resolve every line against
        // catalog-service and reject anything unknown, inactive or out of stock.
        List<String> lowStock = new ArrayList<>();
        List<CartItemDto> items = repriceAgainstCatalog(cart.items(), lowStock);

        BigDecimal itemsTotal = calculateItemsTotal(items);
        BigDecimal deliveryFee = resolveDeliveryFee(cart.region());
        BigDecimal grandTotal = itemsTotal.add(deliveryFee);
        String orderId = UUID.randomUUID().toString();
        long orderNumber = orderRepository.nextOrderNumber();
        Instant now = Instant.now();

        Order order = buildOrder(orderId, orderNumber, cart, items, itemsTotal, deliveryFee, grandTotal, now);
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

        String message = OrderNotificationMessageBuilder.buildOrderMessage("№" + orderNumber, cart, items, itemsTotal, deliveryFee, grandTotal);
        try {
            telegramNotifier.notifyAdmins(message, orderActions(orderId));
        } catch (Exception e) {
            log.warn("Failed to send telegram notification for order {}", orderId, e);
        }
        if (!lowStock.isEmpty()) {
            try {
                telegramNotifier.notifyAdmins("⚠️ Заканчивается после заказа №" + orderNumber + ":\n" + String.join("\n", lowStock));
            } catch (Exception e) {
                log.warn("Failed to send low-stock alert for order {}", orderId, e);
            }
        }

        return new CheckoutResponseDto(orderId, orderNumber, itemsTotal, deliveryFee, grandTotal);
    }

    /** Callback data the bot sends back when an admin taps a button: "order:<id>:<STATUS>". */
    public static String orderCallback(String orderId, OrderStatus status) {
        return "order:" + orderId + ":" + status.name();
    }

    private List<List<InlineButton>> orderActions(String orderId) {
        List<List<InlineButton>> keyboard = new ArrayList<>();
        keyboard.add(List.of(
                InlineButton.callback("✅ Подтвердить", orderCallback(orderId, OrderStatus.CONFIRMED)),
                InlineButton.callback("❌ Отменить", orderCallback(orderId, OrderStatus.CANCELLED))
        ));
        if (telegramProperties.hasUsableAdminUrl()) {
            keyboard.add(List.of(InlineButton.link("Открыть админку", telegramProperties.getAdminUrl())));
        }
        return keyboard;
    }

    /**
     * Customer text lands in the admin panel and the Telegram message verbatim, so control
     * characters (newlines included) are flattened to spaces — a name can't forge extra lines
     * like "Итого: 0 KGS" into the notification.
     */
    private CartDto sanitize(CartDto cart) {
        String name = singleLine(cart.customerName());
        if (name == null || name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer name is required");
        }
        return new CartDto(name, singleLine(cart.customerPhone()), singleLine(cart.region()), cart.items());
    }

    private static String singleLine(String value) {
        return value == null ? null : value.replaceAll("\\p{Cntrl}", " ").replaceAll("\\s+", " ").strip();
    }

    private List<CartItemDto> repriceAgainstCatalog(List<CartItemDto> requested, List<String> lowStock) {
        Set<Long> variantIds = requested.stream().map(CartItemDto::variantId).collect(Collectors.toSet());
        Map<Long, VariantPricing> pricing = catalogClient.fetchPricing(variantIds);
        // Stock is checked against the variant's total across every line, so splitting one
        // variant over several cart lines can't slip past the check line by line.
        Map<Long, Long> requestedPerVariant = requested.stream()
                .collect(Collectors.groupingBy(CartItemDto::variantId, Collectors.summingLong(CartItemDto::quantity)));

        List<CartItemDto> priced = new ArrayList<>();
        Set<Long> reported = new java.util.HashSet<>();
        for (CartItemDto item : requested) {
            VariantPricing variant = pricing.get(item.variantId());
            if (variant == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown variant: " + item.variantId());
            }
            if (!Boolean.TRUE.equals(variant.active()) || STATUS_SOLD_OUT.equals(variant.status())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Variant is no longer available: " + item.variantId());
            }
            boolean stockChecked = !STATUS_PRE_ORDER.equals(variant.status());
            if (stockChecked && (variant.stockQuantity() == null
                    || variant.stockQuantity() < requestedPerVariant.get(item.variantId()))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough stock for variant: " + item.variantId());
            }
            // what this order leaves on the shelf; one line per variant however many cart lines it spans
            if (stockChecked && reported.add(item.variantId())) {
                long left = variant.stockQuantity() - requestedPerVariant.get(item.variantId());
                if (left <= telegramProperties.getLowStockThreshold()) {
                    lowStock.add("• " + variant.productName() + " (" + variant.sku() + ") — "
                            + (left == 0 ? "закончился" : "осталось " + left));
                }
            }
            priced.add(new CartItemDto(
                    item.variantId(),
                    variant.productName(),
                    variant.sku(),
                    variant.attributes(),
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

    /** Applies an admin edit; a status change must follow {@link OrderStatus#canTransitionTo}. */
    @Transactional
    public OrderDto updateOrder(String id, OrderUpdateRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found: " + id));
        OrderStatus next = request.status();
        if (next != null && next != order.getStatus()) {
            if (!order.getStatus().canTransitionTo(next)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Invalid status transition: " + order.getStatus() + " -> " + next);
            }
            order.setStatus(next);
            order.setStatusUpdatedAt(Instant.now());
            if (next == OrderStatus.CANCELLED) {
                returnStock(order);
            }
        }
        if (request.weightFee() != null) {
            order.setWeightFee(request.weightFee());
        }
        if (request.adminNote() != null) {
            String note = request.adminNote().strip();
            order.setAdminNote(note.isEmpty() ? null : note);
        }
        return toDto(orderRepository.save(order));
    }

    /**
     * Deleting an order that was still open (not cancelled, not delivered) gives its stock
     * back first, the same as cancelling it; a delivered order's goods are gone for good.
     */
    @Transactional
    public void deleteOrder(String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found: " + id));
        if (!order.getStatus().isFinal()) {
            returnStock(order);
        }
        orderRepository.delete(order);
    }

    private void returnStock(Order order) {
        rabbitTemplate.convertAndSend(exchangeName, cancelRoutingKey, new OrderCancelledEvent(order.getId(), Instant.now()));
    }

    private Order buildOrder(
            String orderId, long orderNumber, CartDto cart, List<CartItemDto> items,
            BigDecimal itemsTotal, BigDecimal deliveryFee, BigDecimal grandTotal, Instant now
    ) {
        Order order = Order.builder()
                .id(orderId)
                .number(orderNumber)
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
                order.getNumber(),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getRegion(),
                order.getItemsTotal(),
                order.getDeliveryFee(),
                order.getGrandTotal(),
                order.getCreatedAt(),
                order.getStatus(),
                order.getStatusUpdatedAt(),
                order.getWeightFee(),
                order.getFinalTotal(),
                order.getAdminNote(),
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
