package com.adikabuyer.catalog.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JsonAuthenticationEntryPointTest {

    private final JsonAuthenticationEntryPoint entryPoint =
            new JsonAuthenticationEntryPoint(new ObjectMapper().registerModule(new JavaTimeModule()));

    @Test
    void commence_writesJsonEnvelopeWith401() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/catalog/products");
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(request, response, new BadCredentialsException("bad token"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).isEqualTo("application/json");
        assertThat(response.getContentAsString())
                .contains("\"status\":401")
                .contains("\"path\":\"/api/catalog/products\"");
    }
}
