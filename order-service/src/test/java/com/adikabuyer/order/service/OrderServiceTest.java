package com.adikabuyer.order.service;

import com.adikabuyer.order.config.DeliveryFeeProperties;
import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CartItemDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

    private CartDto buildCart(String region) {
        CartItemDto item = new CartItemDto(
                1L,
                "Custom Tumbler",
                "TUM-BLK-500",
                Map.of("color", "black", "size", "500ml"),
                BigDecimal.valueOf(25),
                2
        );
        return new CartDto("John Doe", "996700123456", region, List.of(item));
    }

    @Test
    void checkout_addsRegionalDeliveryFee_whenRegionIsNotDefault() {
        when(deliveryFeeProperties.getFees()).thenReturn(Map.of("osh", BigDecimal.valueOf(200)));
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("osh"));

        assertThat(response.itemsTotal()).isEqualByComparingTo(BigDecimal.valueOf(50));
        assertThat(response.deliveryFee()).isEqualByComparingTo(BigDecimal.valueOf(200));
        assertThat(response.grandTotal()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }

    @Test
    void checkout_formatsWhatsappMessage_withCustomerDetailsAndItems() {
        when(deliveryFeeProperties.getFees()).thenReturn(Map.of("osh", BigDecimal.valueOf(200)));
        when(deliveryFeeProperties.getDefaultFee()).thenReturn(BigDecimal.valueOf(250));

        CheckoutResponseDto response = orderService.checkout(buildCart("osh"));

        assertThat(response.whatsappUrl()).startsWith("https://wa.me/996707660433?text=");

        String encodedMessage = response.whatsappUrl().substring(response.whatsappUrl().indexOf("text=") + 5);
        String message = URLDecoder.decode(encodedMessage, StandardCharsets.UTF_8);

        assertThat(message)
                .contains("Customer: John Doe")
                .contains("Phone: 996700123456")
                .contains("Region: osh")
                .contains("2x Custom Tumbler (TUM-BLK-500)")
                .contains("Items total: 50")
                .contains("Delivery fee: 200")
                .contains("Grand total: 250");
    }
}
