package com.adikabuyer.order.controller;

import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.TelegramAdminDto;
import com.adikabuyer.order.security.CheckoutRateLimiter;
import com.adikabuyer.order.service.OrderService;
import com.adikabuyer.order.telegram.TelegramAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = OrderController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private TelegramAdminService telegramAdminService;

    @MockitoBean
    private CheckoutRateLimiter checkoutRateLimiter;

    @BeforeEach
    void allowCheckoutsByDefault() {
        when(checkoutRateLimiter.isAllowed(anyString())).thenReturn(true);
    }

    private String validCartJson() {
        return """
                {
                  "customerName": "John Doe",
                  "customerPhone": "996700123456",
                  "region": "Бишкек",
                  "items": [
                    {
                      "variantId": 1,
                      "productName": "Custom Tumbler",
                      "sku": "TUM-BLK-500",
                      "attributes": { "color": "black" },
                      "unitPrice": 25,
                      "quantity": 2
                    }
                  ]
                }
                """;
    }

    @Test
    void checkout_returns200_whenPayloadIsValid() throws Exception {
        CheckoutResponseDto response = new CheckoutResponseDto(
                "order-1", 1042L, BigDecimal.valueOf(50), BigDecimal.valueOf(150), BigDecimal.valueOf(200)
        );
        when(orderService.checkout(any())).thenReturn(response);

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(validCartJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value("order-1"))
                .andExpect(jsonPath("$.orderNumber").value(1042))
                .andExpect(jsonPath("$.grandTotal").value(200));
    }

    @Test
    void checkout_returns429_andSkipsTheOrder_whenTheClientIsOverTheLimit() throws Exception {
        when(checkoutRateLimiter.isAllowed("203.0.113.7")).thenReturn(false);

        mockMvc.perform(post("/api/orders/checkout")
                        .header("X-Real-Ip", "203.0.113.7")
                        .contentType("application/json")
                        .content(validCartJson()))
                .andExpect(status().isTooManyRequests());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_keysTheLimitOnTheRealClientIp() throws Exception {
        when(orderService.checkout(any())).thenReturn(new CheckoutResponseDto("order-1", 1042L, BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ONE));

        mockMvc.perform(post("/api/orders/checkout")
                        .header("X-Real-Ip", " 198.51.100.4 ")
                        .contentType("application/json")
                        .content(validCartJson()))
                .andExpect(status().isOk());

        verify(checkoutRateLimiter).isAllowed(eq("198.51.100.4"));
    }

    @Test
    void checkout_returns400_whenRegionIsNotBishkekOrPickup() throws Exception {
        String payload = validCartJson().replace("\"Бишкек\"", "\"Ош\"");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json;charset=UTF-8")
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.region").exists());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_acceptsPickup_inAnyCase() throws Exception {
        when(orderService.checkout(any())).thenReturn(new CheckoutResponseDto("order-1", 1042L, BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ONE));
        String payload = validCartJson().replace("\"Бишкек\"", "\"Самовывоз\"");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json;charset=UTF-8")
                        .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void checkout_returns400_whenPhoneContainsLettersOrMarkup() throws Exception {
        String payload = validCartJson().replace("\"996700123456\"", "\"<script>alert(1)</script>\"");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json;charset=UTF-8")
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.customerPhone").exists());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_returns400_whenBodyIsMalformedJson() throws Exception {
        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content("{ not valid json"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_returns400_whenCustomerNameIsBlank() throws Exception {
        String payload = validCartJson().replace("\"John Doe\"", "\"   \"");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.customerName").exists());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_returns400_whenCustomerPhoneIsMissing() throws Exception {
        String payload = validCartJson().replace("\"customerPhone\": \"996700123456\",", "");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.customerPhone").exists());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_returns400_whenItemsListIsEmpty() throws Exception {
        String payload = validCartJson().replaceAll("(?s)\"items\":\\s*\\[.*\\]", "\"items\": []");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.items").exists());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_returns400_whenUnitPriceIsNegative() throws Exception {
        String payload = validCartJson().replace("\"unitPrice\": 25", "\"unitPrice\": -25");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_returns400_whenUnitPriceIsZero() throws Exception {
        String payload = validCartJson().replace("\"unitPrice\": 25", "\"unitPrice\": 0");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_returns400_whenQuantityIsNegative() throws Exception {
        String payload = validCartJson().replace("\"quantity\": 2", "\"quantity\": -1");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_returns400_whenVariantIdIsMissing() throws Exception {
        String payload = validCartJson().replace("\"variantId\": 1,", "");

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(orderService);
    }

    @Test
    void checkout_returns400_whenItemsListExceedsMaxSize() throws Exception {
        String singleItem = """
                {
                  "variantId": %d,
                  "productName": "Custom Tumbler",
                  "sku": "TUM-BLK-500",
                  "attributes": { "color": "black" },
                  "unitPrice": 25,
                  "quantity": 1
                }
                """;
        String items = IntStream.range(0, 51)
                .mapToObj(i -> String.format(singleItem, i))
                .collect(Collectors.joining(","));

        String payload = """
                {
                  "customerName": "John Doe",
                  "customerPhone": "996700123456",
                  "region": "Бишкек",
                  "items": [%s]
                }
                """.formatted(items);

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.items").exists());

        verifyNoInteractions(orderService);
    }

    @Test
    void getAllOrders_returns200WithOrderList() throws Exception {
        OrderDto order = new OrderDto(
                "order-1", 1042L, "John Doe", "996700123456", "bishkek",
                BigDecimal.valueOf(50), BigDecimal.valueOf(150), BigDecimal.valueOf(200),
                Instant.parse("2026-01-01T00:00:00Z"), com.adikabuyer.order.domain.OrderStatus.NEW, null, List.of()
        );
        when(orderService.getAllOrders()).thenReturn(List.of(order));

        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("order-1"))
                .andExpect(jsonPath("$[0].customerName").value("John Doe"));
    }

    @Test
    void updateOrder_passesTheRequestedStatusThrough() throws Exception {
        when(orderService.updateOrder(org.mockito.ArgumentMatchers.eq("order-1"), any())).thenReturn(null);

        mockMvc.perform(patch("/api/orders/order-1").contentType("application/json").content("{\"status\": \"CONFIRMED\"}"))
                .andExpect(status().isOk());

        verify(orderService).updateOrder("order-1", new com.adikabuyer.order.dto.OrderUpdateRequest(com.adikabuyer.order.domain.OrderStatus.CONFIRMED));
    }

    @Test
    void updateOrder_returns400_forAnUnknownStatus() throws Exception {
        mockMvc.perform(patch("/api/orders/order-1").contentType("application/json").content("{\"status\": \"TELEPORTED\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(orderService);
    }

    @Test
    void getTelegramAdmins_returns200WithAdminList() throws Exception {
        TelegramAdminDto admin = new TelegramAdminDto(123L, "shop_owner", Instant.parse("2026-01-01T00:00:00Z"));
        when(telegramAdminService.listAdmins()).thenReturn(List.of(admin));

        mockMvc.perform(get("/api/orders/telegram-admins"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].chatId").value(123))
                .andExpect(jsonPath("$[0].username").value("shop_owner"));
    }

    @Test
    void deleteOrder_returns200_andDelegatesToService() throws Exception {
        mockMvc.perform(delete("/api/orders/order-1"))
                .andExpect(status().isOk());

        verify(orderService).deleteOrder("order-1");
    }
}
