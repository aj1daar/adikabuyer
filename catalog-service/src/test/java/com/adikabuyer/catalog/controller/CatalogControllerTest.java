package com.adikabuyer.catalog.controller;

import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.exception.OutOfStockException;
import com.adikabuyer.catalog.service.CatalogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = CatalogController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
class CatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CatalogService catalogService;

    @Test
    void getAllProducts_returns200WithProductList() throws Exception {
        ProductDto product = new ProductDto(1L, "Tumbler", "desc", "Drinkware", BigDecimal.TEN, true, null, List.of());
        when(catalogService.getAllProducts()).thenReturn(List.of(product));

        mockMvc.perform(get("/api/catalog/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Tumbler"));
    }

    @Test
    void getAllProducts_returns200WithEmptyArray_whenCatalogIsEmpty() throws Exception {
        when(catalogService.getAllProducts()).thenReturn(List.of());

        mockMvc.perform(get("/api/catalog/products"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void getProductById_returns200_whenProductExists() throws Exception {
        ProductDto product = new ProductDto(1L, "Tumbler", "desc", "Drinkware", BigDecimal.TEN, true, null, List.of());
        when(catalogService.getProductById(1L)).thenReturn(product);

        mockMvc.perform(get("/api/catalog/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tumbler"));
    }

    @Test
    void getProductById_returns404_whenProductMissing() throws Exception {
        when(catalogService.getProductById(99L))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: 99"));

        mockMvc.perform(get("/api/catalog/products/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getProductById_returns400_whenIdIsNotNumeric() throws Exception {
        mockMvc.perform(get("/api/catalog/products/not-a-number"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getVariantAvailability_returns200True_whenVariantAvailable() throws Exception {
        when(catalogService.isVariantAvailable(1L, 2)).thenReturn(true);

        mockMvc.perform(get("/api/catalog/variants/1/availability").param("quantity", "2"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void getVariantAvailability_defaultsQuantityToOne_whenParamMissing() throws Exception {
        when(catalogService.isVariantAvailable(1L, 1)).thenReturn(true);

        mockMvc.perform(get("/api/catalog/variants/1/availability"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    void getVariantAvailability_returns409_whenOutOfStock() throws Exception {
        when(catalogService.isVariantAvailable(eq(1L), anyInt()))
                .thenThrow(new OutOfStockException("Variant out of stock: 1"));

        mockMvc.perform(get("/api/catalog/variants/1/availability").param("quantity", "5"))
                .andExpect(status().isConflict());
    }

    @Test
    void getVariantAvailability_returns400_whenQuantityIsNegative() throws Exception {
        when(catalogService.isVariantAvailable(1L, -1))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested quantity must be positive"));

        mockMvc.perform(get("/api/catalog/variants/1/availability").param("quantity", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getVariantAvailability_returns400_whenQuantityIsNotNumeric() throws Exception {
        mockMvc.perform(get("/api/catalog/variants/1/availability").param("quantity", "banana"))
                .andExpect(status().isBadRequest());
    }

    private String validProductJson() {
        return """
                {
                  "name": "Custom Tumbler",
                  "description": "desc",
                  "category": "Drinkware",
                  "basePrice": 25,
                  "active": true,
                  "imageUrl": "http://localhost:9000/adikabuyer-media/photo.png",
                  "variants": [
                    {
                      "sku": "TUM-BLK-500",
                      "attributes": { "color": "black" },
                      "priceOverride": null,
                      "stockQuantity": 10,
                      "active": true
                    }
                  ]
                }
                """;
    }

    @Test
    void createProduct_returns201WithCreatedProduct() throws Exception {
        ProductDto created = new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), true, null, List.of());
        when(catalogService.createProduct(any())).thenReturn(created);

        mockMvc.perform(post("/api/catalog/products").contentType("application/json").content(validProductJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Custom Tumbler"));
    }

    @Test
    void createProduct_returns400_whenNameIsBlank() throws Exception {
        String payload = validProductJson().replace("\"Custom Tumbler\"", "\"\"");

        mockMvc.perform(post("/api/catalog/products").contentType("application/json").content(payload))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(catalogService);
    }

    @Test
    void createProduct_returns400_whenBasePriceIsMissing() throws Exception {
        String payload = validProductJson().replace("\"basePrice\": 25,", "");

        mockMvc.perform(post("/api/catalog/products").contentType("application/json").content(payload))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(catalogService);
    }

    @Test
    void createProduct_returns400_whenVariantStockIsNegative() throws Exception {
        String payload = validProductJson().replace("\"stockQuantity\": 10", "\"stockQuantity\": -1");

        mockMvc.perform(post("/api/catalog/products").contentType("application/json").content(payload))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(catalogService);
    }

    @Test
    void createProduct_returns409_whenServiceReportsSkuConflict() throws Exception {
        when(catalogService.createProduct(any()))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "One or more variant SKUs already exist"));

        mockMvc.perform(post("/api/catalog/products").contentType("application/json").content(validProductJson()))
                .andExpect(status().isConflict());
    }

    @Test
    void updateProduct_returns200WithUpdatedProduct() throws Exception {
        ProductDto updated = new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), true, null, List.of());
        when(catalogService.updateProduct(eq(1L), any())).thenReturn(updated);

        mockMvc.perform(put("/api/catalog/products/1").contentType("application/json").content(validProductJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Custom Tumbler"));
    }

    @Test
    void updateProduct_returns404_whenProductMissing() throws Exception {
        when(catalogService.updateProduct(eq(99L), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: 99"));

        mockMvc.perform(put("/api/catalog/products/99").contentType("application/json").content(validProductJson()))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteProduct_returns204_whenSuccessful() throws Exception {
        mockMvc.perform(delete("/api/catalog/products/1"))
                .andExpect(status().isNoContent());

        verify(catalogService).deleteProduct(1L);
    }

    @Test
    void deleteProduct_returns404_whenProductMissing() throws Exception {
        org.mockito.Mockito.doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: 99"))
                .when(catalogService).deleteProduct(99L);

        mockMvc.perform(delete("/api/catalog/products/99"))
                .andExpect(status().isNotFound());
    }
}
