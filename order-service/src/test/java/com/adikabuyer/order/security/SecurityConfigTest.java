package com.adikabuyer.order.security;

import com.adikabuyer.order.controller.OrderController;
import com.adikabuyer.order.service.OrderService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OrderController.class)
@Import({SecurityConfig.class, JwtUtil.class, JsonAuthenticationEntryPoint.class, JsonAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "app.jwt.secret=test-secret-key-that-is-at-least-32-bytes-long"
})
class SecurityConfigTest {

    private static final String JWT_SECRET = "test-secret-key-that-is-at-least-32-bytes-long";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    private String token(String role) {
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        Instant now = Instant.now();
        return Jwts.builder()
                .subject("admin")
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .signWith(key)
                .compact();
    }

    @Test
    void getAllOrders_returns401_withoutToken() throws Exception {
        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllOrders_returns403_withNonAdminRole() throws Exception {
        mockMvc.perform(get("/api/orders").header("Authorization", "Bearer " + token("STAFF")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllOrders_returns200_withAdminToken() throws Exception {
        when(orderService.getAllOrders()).thenReturn(List.of());

        mockMvc.perform(get("/api/orders").header("Authorization", "Bearer " + token("ADMIN")))
                .andExpect(status().isOk());
    }
}
