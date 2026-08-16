package com.adikabuyer.order.service;

import com.adikabuyer.order.config.DeliveryFeeProperties;
import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CartItemDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderPlacedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private DeliveryFeeProperties deliveryFeeProperties;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(rabbitTemplate, deliveryFeeProperties);
        ReflectionTestUtils.setField(orderService, "storePhoneNumber", "996707660433");
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

    private String decodeWhatsappMessage(CheckoutResponseDto response) {
        String encodedMessage = response.whatsappUrl().substring(response.whatsappUrl().indexOf("text=") + 5);
        return URLDecoder.decode(encodedMessage, StandardCharsets.UTF_8);
    }

    @Test
    void checkout_addsRegionalDeliveryFee_whenRegionIsNotDefault() {
        when(deliveryFeeProperties.getFees()).thenReturn(Map.of("osh", BigDecimal.valueOf(200)));
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("osh", buildItem(BigDecimal.valueOf(25), 2)));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.valueOf(50));
        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(200));
        assertThat(response.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    void checkout_formatsWhatsappMessage_withCustomerDetailsAndItems() {
        when(deliveryFeeProperties.getFees()).thenReturn(Map.of("osh", BigDecimal.valueOf(200)));
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("osh", buildItem(BigDecimal.valueOf(25), 2)));

        assertThat(response.whatsappUrl()).startsWith("https://wa.me/996707660433?text=");

        String message = decodeWhatsappMessage(response);

        assertThat(message)
                .contains("Customer: John Doe")
                .contains("Phone: 996700123456")
                .contains("Region: osh")
                .contains("2x Custom Tumbler (TUM-BLK-500)")
                .contains("Items total: 50")
                .contains("Delivery fee: 200")
                .contains("Grand total: 250");
    }

    @Test
    void checkout_fallsBackToDefaultFee_whenRegionIsUnknown() {
        when(deliveryFeeProperties.getFees()).thenReturn(Map.of("osh", BigDecimal.valueOf(200)));
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("atlantis", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    void checkout_fallsBackToDefaultFee_whenRegionIsNull() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart(null, buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    void checkout_matchesRegionCaseInsensitively() {
        when(deliveryFeeProperties.getFees()).thenReturn(Map.of("osh", BigDecimal.valueOf(200)));
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("OSH", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(200));
    }

    @Test
    void checkout_resolvesRegionalFee_whenRegionHasLeadingOrTrailingWhitespace() {
        when(deliveryFeeProperties.getFees()).thenReturn(Map.of("osh", BigDecimal.valueOf(200)));
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("  Osh  ", buildItem(BigDecimal.TEN, 1)));

        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(200));
    }

    @Test
    void checkout_generatesUniqueOrderId_onEachCall() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.ZERO);

        CheckoutResponseDto first = orderService.checkout(buildCart("bishkek", buildItem(BigDecimal.TEN, 1)));
        CheckoutResponseDto second = orderService.checkout(buildCart("bishkek", buildItem(BigDecimal.TEN, 1)));

        assertThat(first.orderId()).isNotEqualTo(second.orderId());
    }

    @Test
    void checkout_sumsMultipleLineItems() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.ZERO);

        CartItemDto first = buildItem(BigDecimal.valueOf(10), 2);
        CartItemDto second = new CartItemDto(2L, "Gym Shorts", "GYM-BLK-M", Map.of("size", "M"), BigDecimal.valueOf(15), 3);

        CheckoutResponseDto response = orderService.checkout(buildCart("bishkek", first, second));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.valueOf(65));
    }

    @Test
    void checkout_handlesEmptyItemsList_withoutThrowing() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(100));

        CheckoutResponseDto response = orderService.checkout(new CartDto("John Doe", "996700123456", "bishkek", List.of()));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(100));
    }

    @Test
    void checkout_doesNotThrow_whenQuantityIsVeryLarge() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.ZERO);

        CheckoutResponseDto response = orderService.checkout(
                buildCart("bishkek", buildItem(BigDecimal.valueOf(9999), Integer.MAX_VALUE))
        );

        assertThat(response.itemsTotal()).isPositive();
    }

    @Test
    void checkout_urlEncodesHostileCustomerName_soWhatsappLinkStructureCannotBeBroken() {
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.ZERO);

        CartDto cart = new CartDto(
                "Robert'); DROP TABLE orders;-- <script>alert(1)</script>\r\nExtra: injected",
                "996700123456",
                "bishkek",
                List.of(buildItem(BigDecimal.TEN, 1))
        );

        CheckoutResponseDto response = orderService.checkout(cart);
        String rawUrl = response.whatsappUrl();

        assertThat(rawUrl).doesNotContain("<script>").doesNotContain("\r\n").doesNotContain(" ");
        assertThat(decodeWhatsappMessage(response)).contains("<script>alert(1)</script>");
    }

    @Test
    void checkout_publishesOrderPlacedEventToConfiguredExchangeAndRoutingKey() {
        when(deliveryFeeProperties.getFees()).thenReturn(Map.of("osh", BigDecimal.valueOf(200)));
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(250));

        orderService.checkout(buildCart("osh", buildItem(BigDecimal.valueOf(25), 2)));

        ArgumentCaptor<OrderPlacedEvent> eventCaptor = ArgumentCaptor.forClass(OrderPlacedEvent.class);
        verify(rabbitTemplate).convertAndSend(anyString(), anyString(), eventCaptor.capture());

        OrderPlacedEvent event = eventCaptor.getValue();
        assertThat(event.customerName()).isEqualTo("John Doe");
        assertThat(event.region()).isEqualTo("osh");
        assertThat(event.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(250));
        assertThat(event.orderId()).isNotBlank();
    }
}
