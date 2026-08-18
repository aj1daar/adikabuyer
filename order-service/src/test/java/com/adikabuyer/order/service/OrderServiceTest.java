package com.adikabuyer.order.service;

import com.adikabuyer.order.config.DeliveryFeeProperties;
import com.adikabuyer.order.domain.Order;
import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CartItemDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.OrderPlacedEvent;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
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

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, rabbitTemplate, deliveryFeeProperties, telegramNotifier);
        ReflectionTestUtils.setField(orderService, "exchangeName", "order.exchange");
        ReflectionTestUtils.setField(orderService, "routingKey", "order.new");
    }

    private CartItemDto buildItem(BigDecimal unitPrice, int quantity) {
        return new CartItemDto(
                1L,
                "Custom Tumbler",
                "TUM-BLK-500",
                Map.of("color", "black", "size", "500ml"),
                unitPrice,
                quantity
        );
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
    void checkout_usesBishkekFee_whenRegionIsBishkek() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("Бишкек", buildItem(BigDecimal.valueOf(25), 2)));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.valueOf(50));
        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(250));
        assertThat(response.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(300));
    }

    @Test
    void checkout_usesDefaultFee_whenRegionIsAnyOtherCity() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(500));

        CheckoutResponseDto response = orderService.checkout(buildCart("Ош", buildItem(BigDecimal.valueOf(25), 2)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(response.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(550));
    }

    @Test
    void checkout_persistsOrderWithItems() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(500));

        CheckoutResponseDto response = orderService.checkout(buildCart("Ош", buildItem(BigDecimal.valueOf(25), 2)));

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());

        Order saved = orderCaptor.getValue();
        assertThat(saved.getId()).isEqualTo(response.orderId());
        assertThat(saved.getCustomerName()).isEqualTo("John Doe");
        assertThat(saved.getRegion()).isEqualTo("Ош");
        assertThat(saved.getGrandTotal()).isEqualByComparingTo(BigDecimal.valueOf(550));
        assertThat(saved.getItems()).hasSize(1);
        assertThat(saved.getItems().get(0).getSku()).isEqualTo("TUM-BLK-500");
        assertThat(saved.getItems().get(0).getOrder()).isSameAs(saved);
    }

    @Test
    void checkout_formatsTelegramMessage_withCustomerDetailsAndItems() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(500));

        orderService.checkout(buildCart("Ош", buildItem(BigDecimal.valueOf(25), 2)));

        assertThat(captureTelegramMessage())
                .contains("Имя: John Doe")
                .contains("Телефон: 996700123456")
                .contains("Город: Ош")
                .contains("2x Custom Tumbler (black, 500ml, TUM-BLK-500) — 50 KGS")
                .contains("Товары: 50 KGS")
                .contains("Доставка: 500 KGS")
                .contains("Итого: 550 KGS");
    }

    @Test
    void checkout_formatsLargeTotals_withGroupedDigitsAndNoKopecks() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(500));

        orderService.checkout(buildCart("Ош", buildItem(BigDecimal.valueOf(2200.50), 5)));

        assertThat(captureTelegramMessage())
                .contains("Товары: 11 003 KGS")
                .contains("Итого: 11 503 KGS");
    }

    @Test
    void checkout_omitsAutoGeneratedSku_fromTelegramMessage() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(250));

        CartItemDto item = new CartItemDto(
                1L, "Предмет", "DEFAULT-8C54E689", Map.of(), BigDecimal.valueOf(2200), 1
        );

        orderService.checkout(buildCart("Бишкек", item));

        assertThat(captureTelegramMessage())
                .contains("1x Предмет — 2 200 KGS")
                .doesNotContain("DEFAULT-");
    }

    @Test
    void checkout_usesDefaultFee_whenRegionIsUnknownCity() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(500));

        CheckoutResponseDto response = orderService.checkout(buildCart("Атлантида", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(500));
    }

    @Test
    void checkout_usesDefaultFee_whenRegionIsNull() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(500));

        CheckoutResponseDto response = orderService.checkout(buildCart(null, buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(500));
    }

    @Test
    void checkout_matchesBishkekCaseInsensitively() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("БИШКЕК", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    void checkout_resolvesBishkekFee_whenRegionHasLeadingOrTrailingWhitespace() {
        when(deliveryFeeProperties.getBishkekFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("  Бишкек  ", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    void checkout_generatesUniqueOrderId_onEachCall() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.ZERO);

        CheckoutResponseDto first = orderService.checkout(buildCart("Ош", buildItem(BigDecimal.TEN, 1)));
        CheckoutResponseDto second = orderService.checkout(buildCart("Ош", buildItem(BigDecimal.TEN, 1)));

        assertThat(first.orderId()).isNotEqualTo(second.orderId());
    }

    @Test
    void checkout_sumsMultipleLineItems() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.ZERO);

        CartItemDto first = buildItem(BigDecimal.valueOf(10), 2);
        CartItemDto second = new CartItemDto(2L, "Gym Shorts", "GYM-BLK-M", Map.of("size", "M"), BigDecimal.valueOf(15), 3);

        CheckoutResponseDto response = orderService.checkout(buildCart("Ош", first, second));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.valueOf(65));
    }

    @Test
    void checkout_handlesEmptyItemsList_withoutThrowing() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(100));

        CheckoutResponseDto response = orderService.checkout(new CartDto("John Doe", "996700123456", "Ош", List.of()));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void checkout_doesNotThrow_whenQuantityIsVeryLarge() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.ZERO);

        CheckoutResponseDto response = orderService.checkout(
                buildCart("Ош", buildItem(BigDecimal.valueOf(9999), Integer.MAX_VALUE))
        );

        assertThat(response.itemsTotal()).isPositive();
    }

    @Test
    void checkout_keepsHostileCustomerNameVerbatim_inTelegramMessage() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.ZERO);

        CartDto cart = new CartDto(
                "Robert'); DROP TABLE orders;-- <script>alert(1)</script>",
                "996700123456",
                "Ош",
                List.of(buildItem(BigDecimal.TEN, 1))
        );

        orderService.checkout(cart);

        assertThat(captureTelegramMessage()).contains("<script>alert(1)</script>");
    }

    @Test
    void checkout_doesNotFail_whenTelegramNotificationThrows() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.ZERO);
        org.mockito.Mockito.doThrow(new RuntimeException("telegram down"))
                .when(telegramNotifier).notifyAdmins(anyString());

        CheckoutResponseDto response = orderService.checkout(buildCart("Ош", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.orderId()).isNotBlank();
    }

    @Test
    void checkout_publishesOrderPlacedEventToConfiguredExchangeAndRoutingKey() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(500));

        orderService.checkout(buildCart("Ош", buildItem(BigDecimal.valueOf(25), 2)));

        ArgumentCaptor<OrderPlacedEvent> eventCaptor = ArgumentCaptor.forClass(OrderPlacedEvent.class);
        verify(rabbitTemplate).convertAndSend(anyString(), anyString(), eventCaptor.capture());

        OrderPlacedEvent event = eventCaptor.getValue();
        assertThat(event.customerName()).isEqualTo("John Doe");
        assertThat(event.region()).isEqualTo("Ош");
        assertThat(event.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(550));
        assertThat(event.orderId()).isNotBlank();
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
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("404");

        verify(orderRepository, never()).deleteById(anyString());
    }
}
