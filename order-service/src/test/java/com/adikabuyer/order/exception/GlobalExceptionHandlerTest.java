package com.adikabuyer.order.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private HttpServletRequest requestFor(String path) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn(path);
        return request;
    }

    @Test
    void handleValidation_populatesFieldErrors() {
        FieldError fieldError = new FieldError("cartDto", "customerName", "must not be blank");
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(
                mock(MethodParameter.class), bindingResult
        );

        ResponseEntity<ErrorResponse> response = handler.handleValidation(ex, requestFor("/api/orders/checkout"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().fieldErrors()).containsEntry("customerName", "must not be blank");
    }

    @Test
    void handleMalformedJson_returns400() {
        ResponseEntity<ErrorResponse> response = handler.handleMalformedJson(requestFor("/api/orders/checkout"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().message()).isEqualTo("Malformed request body");
    }

    @Test
    void handleTypeMismatch_includesParameterNameInMessage() {
        MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("quantity");

        ResponseEntity<ErrorResponse> response = handler.handleTypeMismatch(ex, requestFor("/api/orders/checkout"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().message()).contains("quantity");
    }

    @Test
    void handleResponseStatusException_mapsStatusReasonAndPath() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found: 99");

        ResponseEntity<ErrorResponse> response = handler.handleResponseStatusException(ex, requestFor("/api/orders/99"));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody().error()).isEqualTo("Not Found");
        assertThat(response.getBody().message()).isEqualTo("Order not found: 99");
    }

    @Test
    void handleUnexpectedException_returns500_withoutLeakingInternalDetails() {
        ResponseEntity<ErrorResponse> response = handler.handleUnexpectedException(
                new RuntimeException("rabbitmq connection refused"), requestFor("/api/orders/checkout")
        );

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody().message()).isEqualTo("An unexpected error occurred");
        assertThat(response.getBody().message()).doesNotContain("rabbitmq connection refused");
    }
}
