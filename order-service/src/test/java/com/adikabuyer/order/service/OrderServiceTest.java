package com.adikabuyer.order.service;

import com.adikabuyer.order.client.CatalogClient;
import com.adikabuyer.order.config.DeliveryFeeProperties;
import com.adikabuyer.order.domain.Order;
import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CartItemDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.OrderPlacedEvent;
import com.adikabuyer.order.dto.VariantPricing;
import com.adikabuyer.order.repository.OrderRepository;
import com.adikabuyer.order.telegram.TelegramNotifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private DeliveryFeeProperties deliveryFeeProperties;

    @Mock
    private TelegramNotifier telegramNotifier;

    @Mock
    private CatalogClient catalogClient;

    private OrderService orderService;

    /** Authoritative pricing the fake catalog will return, keyed by variant id. */
    private final Map<Long, VariantPricing> catalog = new HashMap<>();

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, rabbitTemplate, deliveryFeeProperties, telegramNotifier, catalogClient);
        ReflectionTestUtils.setField(orderService, "exchangeName", "order.exchange");
        ReflectionTestUtils.setField(orderService, "routingKey", "order.new");
        lenient().when(catalogClient.fetchPricing(any())).thenAnswer(invocation -> {
            Collection<Long> ids = invocation.getArgument(0);
            Map<Long, VariantPricing> out = new HashMap<>();
            if (ids != null) {
                for (Long id : ids) {
                    VariantPricing registered = catalog.get(id);
                    if (registered != null) {
                        out.put(id, registered);
                    }
                }
            }
            return out;
        });
    }

    private VariantPricing pricing(long id, BigDecimal price, int stock, boolean active, String status) {
        return new VariantPricing(id, "Custom Tumbler", "TUM-BLK-500", price, stock, active, status);
    }

    /** Registers authoritative pricing for a variant and returns a matching cart line. */
    private CartItemDto item(long id, BigDecimal unitPrice, int quantity) {
        catalog.put(id, pricing(id, unitPrice, Integer.MAX_VALUE, true, "IN_STOCK"));
        return new CartItemDto(id, "Custom Tumbler", "TUM-BLK-500", Map.of("color", "black", "size", "500ml"), unitPrice, quantity);
    }

    private CartItemDto buildItem(BigDecimal unitPrice, int quantity) {
        return item(1L, unitPrice, quantity);
    }

    private CartDto buildCart(String region, CartItemDto... items) {
        return new CartDto("John Doe", "996700123456", region, List.of(items));
    }

    private String captureTelegramMessage() {
        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        verify(telegramNotifier).notifyAdmins(messageCaptor.capture());
        return messageCaptor.getValue();
    }

    @Test
    void checkout_chargesTheCityFee_whenTheCourierDelivers() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(300));

        CheckoutResponseDto response = orderService.checkout(buildCart("Бишкек", buildItem(BigDecimal.valueOf(25), 2)));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.valueOf(50));
        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(300));
        assertThat(response.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(350));
    }

    @Test
    void checkout_chargesNothing_whenTheCustomerPicksTheOrderUp() {
        when(deliveryFeeProperties.getPickupFee()).thenReturn(BigDecimal.ZERO);

        CheckoutResponseDto response = orderService.checkout(buildCart("Самовывоз", buildItem(BigDecimal.valueOf(25), 2)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(50));
    }

    @Test
    void checkout_persistsOrderWithItems() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(500));

        CheckoutResponseDto response = orderService.checkout(buildCart("Бишкек", buildItem(BigDecimal.valueOf(25), 2)));

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());

        Order saved = orderCaptor.getValue();
        assertThat(saved.getId()).isEqualTo(response.orderId());
        assertThat(saved.getCustomerName()).isEqualTo("John Doe");
        assertThat(saved.getRegion()).isEqualTo("Бишкек");
        assertThat(saved.getGrandTotal()).isEqualByComparingTo(BigDecimal.valueOf(550));
        assertThat(saved.getItems()).hasSize(1);
        assertThat(saved.getItems().get(0).getSku()).isEqualTo("TUM-BLK-500");
        assertThat(saved.getItems().get(0).getOrder()).isSameAs(saved);
    }

    @Test
    void checkout_sendsTelegramNotification_withNonBlankMessage() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(500));

        orderService.checkout(buildCart("Бишкек", buildItem(BigDecimal.valueOf(25), 2)));

        assertThat(captureTelegramMessage()).isNotBlank();
    }

    @Test
    void checkout_chargesTheCityFee_whenRegionIsSomethingElse() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(500));

        CheckoutResponseDto response = orderService.checkout(buildCart("Атлантида", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(500));
    }

    @Test
    void checkout_chargesTheCityFee_whenRegionIsNull() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(500));

        CheckoutResponseDto response = orderService.checkout(buildCart(null, buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(500));
    }

    @Test
    void checkout_matchesPickupCaseInsensitively() {
        when(deliveryFeeProperties.getPickupFee()).thenReturn(BigDecimal.ZERO);

        CheckoutResponseDto response = orderService.checkout(buildCart("САМОВЫВОЗ", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void checkout_resolvesPickupFee_whenRegionHasLeadingOrTrailingWhitespace() {
        when(deliveryFeeProperties.getPickupFee()).thenReturn(BigDecimal.ZERO);

        CheckoutResponseDto response = orderService.checkout(buildCart("  Самовывоз  ", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void checkout_generatesUniqueOrderId_onEachCall() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.ZERO);

        CheckoutResponseDto first = orderService.checkout(buildCart("Бишкек", buildItem(BigDecimal.TEN, 1)));
        CheckoutResponseDto second = orderService.checkout(buildCart("Бишкек", buildItem(BigDecimal.TEN, 1)));

        assertThat(first.orderId()).isNotEqualTo(second.orderId());
    }

    @Test
    void checkout_sumsMultipleLineItems() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.ZERO);

        CartItemDto first = buildItem(BigDecimal.valueOf(10), 2);
        CartItemDto second = item(2L, BigDecimal.valueOf(15), 3);

        CheckoutResponseDto response = orderService.checkout(buildCart("Бишкек", first, second));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.valueOf(65));
    }

    @Test
    void checkout_handlesEmptyItemsList_withoutThrowing() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(100));

        CheckoutResponseDto response = orderService.checkout(new CartDto("John Doe", "996700123456", "Бишкек", List.of()));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void checkout_doesNotThrow_whenQuantityIsVeryLarge() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.ZERO);

        CheckoutResponseDto response = orderService.checkout(
                buildCart("Бишкек", buildItem(BigDecimal.valueOf(9999), Integer.MAX_VALUE))
        );

        assertThat(response.itemsTotal()).isPositive();
    }

    @Test
    void checkout_doesNotFail_whenTelegramNotificationThrows() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.ZERO);
        org.mockito.Mockito.doThrow(new RuntimeException("telegram down"))
                .when(telegramNotifier).notifyAdmins(anyString());

        CheckoutResponseDto response = orderService.checkout(buildCart("Бишкек", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.orderId()).isNotBlank();
    }

    @Test
    void checkout_publishesOrderPlacedEventToConfiguredExchangeAndRoutingKey() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(500));

        orderService.checkout(buildCart("Бишкек", buildItem(BigDecimal.valueOf(25), 2)));

        ArgumentCaptor<OrderPlacedEvent> eventCaptor = ArgumentCaptor.forClass(OrderPlacedEvent.class);
        verify(rabbitTemplate).convertAndSend(anyString(), anyString(), eventCaptor.capture());

        OrderPlacedEvent event = eventCaptor.getValue();
        assertThat(event.customerName()).isEqualTo("John Doe");
        assertThat(event.region()).isEqualTo("Бишкек");
        assertThat(event.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(550));
        assertThat(event.orderId()).isNotBlank();
    }

    @Test
    void checkout_pricesFromCatalog_ignoringClientSuppliedPrice() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.ZERO);
        catalog.put(1L, pricing(1L, BigDecimal.valueOf(1000), Integer.MAX_VALUE, true, "IN_STOCK"));
        CartItemDto tampered = new CartItemDto(1L, "iPhone", "FAKE", Map.of(), BigDecimal.ONE, 2);

        CheckoutResponseDto response = orderService.checkout(buildCart("Бишкек", tampered));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.valueOf(2000));
    }

    @Test
    void checkout_persistsCatalogNameAndSku_notClientValues() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.ZERO);
        catalog.put(1L, new VariantPricing(1L, "Real Product", "REAL-SKU", BigDecimal.TEN, 5, true, "IN_STOCK"));
        CartItemDto tampered = new CartItemDto(1L, "Free Money", "STOLEN", Map.of(), BigDecimal.ONE, 1);

        orderService.checkout(buildCart("Бишкек", tampered));

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());
        assertThat(orderCaptor.getValue().getItems().get(0).getProductName()).isEqualTo("Real Product");
        assertThat(orderCaptor.getValue().getItems().get(0).getSku()).isEqualTo("REAL-SKU");
    }

    @Test
    void checkout_rejectsUnknownVariant_withBadRequest() {
        CartItemDto missing = new CartItemDto(999L, "x", "x", Map.of(), BigDecimal.TEN, 1);
        // variant 999 was never registered in the fake catalog

        assertThatThrownBy(() -> orderService.checkout(buildCart("Бишкек", missing)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");
        verify(orderRepository, never()).save(any());
    }

    @Test
    void checkout_rejectsInactiveVariant_withConflict() {
        catalog.put(1L, pricing(1L, BigDecimal.TEN, 5, false, "IN_STOCK"));
        CartItemDto item = new CartItemDto(1L, "x", "x", Map.of(), BigDecimal.TEN, 1);

        assertThatThrownBy(() -> orderService.checkout(buildCart("Бишкек", item)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    void checkout_rejectsSoldOutVariant_withConflict() {
        catalog.put(1L, pricing(1L, BigDecimal.TEN, 0, true, "SOLD_OUT"));
        CartItemDto item = new CartItemDto(1L, "x", "x", Map.of(), BigDecimal.TEN, 1);

        assertThatThrownBy(() -> orderService.checkout(buildCart("Бишкек", item)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    void checkout_rejectsInsufficientStock_withConflict() {
        catalog.put(1L, pricing(1L, BigDecimal.TEN, 1, true, "IN_STOCK"));
        CartItemDto item = new CartItemDto(1L, "x", "x", Map.of(), BigDecimal.TEN, 5);

        assertThatThrownBy(() -> orderService.checkout(buildCart("Бишкек", item)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    void checkout_allowsPreOrderVariant_withZeroStock() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.ZERO);
        catalog.put(1L, pricing(1L, BigDecimal.valueOf(50), 0, true, "PRE_ORDER"));
        CartItemDto item = new CartItemDto(1L, "x", "x", Map.of(), BigDecimal.valueOf(50), 3);

        CheckoutResponseDto response = orderService.checkout(buildCart("Бишкек", item));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.valueOf(150));
    }

    @Test
    void getAllOrders_mapsPersistedOrdersToDto() {
        Order order = Order.builder()
                .id("order-1")
                .customerName("Jane Doe")
                .customerPhone("996700000000")
                .region("Бишкек")
                .itemsTotal(BigDecimal.valueOf(50))
                .deliveryFee(BigDecimal.valueOf(150))
                .grandTotal(BigDecimal.valueOf(200))
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .items(List.of())
                .build();
        when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(order));

        List<OrderDto> result = orderService.getAllOrders();

        assertThat(result).hasSize(1);
        OrderDto dto = result.get(0);
        assertThat(dto.id()).isEqualTo("order-1");
        assertThat(dto.customerName()).isEqualTo("Jane Doe");
        assertThat(dto.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(200));
    }

    @Test
    void deleteOrder_deletesExistingOrder() {
        when(orderRepository.existsById("order-1")).thenReturn(true);

        orderService.deleteOrder("order-1");

        verify(orderRepository).deleteById("order-1");
    }

    @Test
    void deleteOrder_throwsNotFound_whenOrderDoesNotExist() {
        when(orderRepository.existsById("missing")).thenReturn(false);

        assertThatThrownBy(() -> orderService.deleteOrder("missing"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");

        verify(orderRepository, never()).deleteById(anyString());
    }
}
