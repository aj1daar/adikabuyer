package com.adikabuyer.catalog.security;

import com.adikabuyer.catalog.controller.AuthController;
import com.adikabuyer.catalog.controller.CatalogController;
import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.service.CatalogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {CatalogController.class, AuthController.class})
@Import({SecurityConfig.class, JwtUtil.class, JsonAuthenticationEntryPoint.class, JsonAccessDeniedHandler.class, LoginRateLimiter.class})
@TestPropertySource(properties = {
        "app.jwt.secret=test-secret-key-that-is-at-least-32-bytes-long",
        "app.jwt.expiration-ms=3600000",
        "app.security.admin-username=admin",
        "app.security.admin-password-hash=$2a$10$lCNeUqJeSoXyb6k4Mh6lLe.hWP9dJ0aVqFVwp9GyjjN0B4s3KJV32"
})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private CatalogService catalogService;

    @Autowired
    private LoginRateLimiter loginRateLimiter;

    @BeforeEach
    void resetRateLimiter() {
        loginRateLimiter.reset();
    }

    @Test
    void publicGetEndpoint_isAccessibleWithoutAuthentication() throws Exception {
        ProductDto product = new ProductDto(1L, "Tumbler", null, null, BigDecimal.TEN, true, null, List.of());
        when(catalogService.getAllProducts()).thenReturn(List.of(product));

        mockMvc.perform(get("/api/catalog/products"))
                .andExpect(status().isOk());
    }

    @Test
    void writeEndpoint_isRejected_whenNoTokenProvided() throws Exception {
        mockMvc.perform(post("/api/catalog/products"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void writeEndpoint_isRejected_whenTokenBelongsToNonAdminRole() throws Exception {
        String token = jwtUtil.generateToken("staff-user", "STAFF");

        mockMvc.perform(post("/api/catalog/products").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    void writeEndpoint_isRejected_whenTokenIsTampered() throws Exception {
        String token = jwtUtil.generateToken("admin", "ADMIN");
        String tamperedToken = token.substring(0, token.length() - 2) + "xx";

        mockMvc.perform(post("/api/catalog/products").header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void writeEndpoint_passesSecurity_whenValidAdminTokenProvided() throws Exception {
        String token = jwtUtil.generateToken("admin", "ADMIN");

        int status = mockMvc.perform(post("/api/catalog/products").header("Authorization", "Bearer " + token))
                .andReturn()
                .getResponse()
                .getStatus();

        org.assertj.core.api.Assertions.assertThat(status).isNotIn(401, 403);
    }

    @Test
    void login_returnsToken_whenCredentialsAreCorrect() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void login_returns401_whenPasswordIsWrong() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_returns429_afterExceedingRateLimit() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"admin\",\"password\":\"wrong-password\"}"));
        }

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void catalogNotFoundError_isNotMaskedBySecurity_onInternalErrorForward() throws Exception {
        when(catalogService.getProductById(999L))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Product not found: 999"
                ));

        mockMvc.perform(get("/api/catalog/products/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void login_returns401_whenUsernameIsUnknown() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"hacker\",\"password\":\"admin123\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_returns400_whenUsernameIsBlank() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"admin123\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void issuedToken_grantsAccessToWriteEndpoint_endToEnd() throws Exception {
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = loginResponse.split("\"token\":\"")[1].split("\"")[0];

        int status = mockMvc.perform(post("/api/catalog/products").header("Authorization", "Bearer " + token))
                .andReturn()
                .getResponse()
                .getStatus();

        org.assertj.core.api.Assertions.assertThat(status).isNotIn(401, 403);
    }
}
