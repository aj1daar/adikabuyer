package com.adikabuyer.catalog.security;

import tools.jackson.databind.json.JsonMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JsonAccessDeniedHandlerTest {

    private final JsonAccessDeniedHandler accessDeniedHandler =
            new JsonAccessDeniedHandler(new JsonMapper());

    @Test
    void handle_writesJsonEnvelopeWith403() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/catalog/products");
        MockHttpServletResponse response = new MockHttpServletResponse();

        accessDeniedHandler.handle(request, response, new AccessDeniedException("insufficient role"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).isEqualTo("application/json");
        assertThat(response.getContentAsString())
                .contains("\"status\":403")
                .contains("\"path\":\"/api/catalog/products\"");
    }
}
