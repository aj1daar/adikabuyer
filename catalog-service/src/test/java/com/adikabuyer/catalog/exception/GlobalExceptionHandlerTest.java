package com.adikabuyer.catalog.exception;

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
    void handleResponseStatusException_mapsStatusReasonAndPath() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: 99");

        ResponseEntity<ErrorResponse> response = handler.handleResponseStatusException(ex, requestFor("/api/catalog/products/99"));

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().error()).isEqualTo("Not Found");
        assertThat(response.getBody().message()).isEqualTo("Product not found: 99");
        assertThat(response.getBody().path()).isEqualTo("/api/catalog/products/99");
    }

    @Test
    void handleOutOfStock_mapsToConflict() {
        OutOfStockException ex = new OutOfStockException("Variant out of stock: 1");

        ResponseEntity<ErrorResponse> response = handler.handleOutOfStock(ex, requestFor("/api/catalog/variants/1/availability"));

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody().message()).isEqualTo("Variant out of stock: 1");
    }

    @Test
    void handleValidation_populatesFieldErrors() {
        FieldError fieldError = new FieldError("productRequest", "name", "must not be blank");
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(
                mock(MethodParameter.class), bindingResult
        );

        ResponseEntity<ErrorResponse> response = handler.handleValidation(ex, requestFor("/api/catalog/products"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().fieldErrors()).containsEntry("name", "must not be blank");
    }

    @Test
    void handleMalformedJson_returns400() {
        ResponseEntity<ErrorResponse> response = handler.handleMalformedJson(requestFor("/api/catalog/products"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().message()).isEqualTo("Malformed request body");
    }

    @Test
    void handleTypeMismatch_includesParameterNameInMessage() {
        MethodArgumentTypeMismatchException ex = mock(MethodArgumentTypeMismatchException.class);
        when(ex.getName()).thenReturn("id");

        ResponseEntity<ErrorResponse> response = handler.handleTypeMismatch(ex, requestFor("/api/catalog/products/abc"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody().message()).contains("id");
    }

    @Test
    void handleMaxUploadSizeExceeded_returns400() {
        ResponseEntity<ErrorResponse> response = handler.handleMaxUploadSizeExceeded(requestFor("/api/media/upload"));

        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void handleUnexpectedException_returns500_withoutLeakingInternalDetails() {
        ResponseEntity<ErrorResponse> response = handler.handleUnexpectedException(
                new RuntimeException("db connection pool exhausted"), requestFor("/api/catalog/products")
        );

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody().message()).isEqualTo("An unexpected error occurred");
        assertThat(response.getBody().message()).doesNotContain("db connection pool exhausted");
    }
}
