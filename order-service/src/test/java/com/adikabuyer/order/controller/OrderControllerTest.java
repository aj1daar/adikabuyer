package com.adikabuyer.order.controller;

import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @MockBean
    private OrderService orderService;

    private String validCartJson() {
        return """
                {
                  "customerName": "John Doe",
                  "customerPhone": "996700123456",
                  "region": "bishkek",
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
                "order-1", BigDecimal.valueOf(50), BigDecimal.valueOf(150), BigDecimal.valueOf(200)
        );
        when(orderService.checkout(any())).thenReturn(response);

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType("application/json")
                        .content(validCartJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value("order-1"))
                .andExpect(jsonPath("$.grandTotal").value(200));
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
                  "region": "bishkek",
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
                "order-1", "John Doe", "996700123456", "bishkek",
                BigDecimal.valueOf(50), BigDecimal.valueOf(150), BigDecimal.valueOf(200),
                Instant.parse("2026-01-01T00:00:00Z"), List.of()
        );
        when(orderService.getAllOrders()).thenReturn(List.of(order));

        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("order-1"))
                .andExpect(jsonPath("$[0].customerName").value("John Doe"));
    }
}
