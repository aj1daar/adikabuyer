package com.adikabuyer.catalog.controller;

import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.dto.ProductPageResponse;
import com.adikabuyer.catalog.dto.ProductRequest;
import com.adikabuyer.catalog.dto.VariantPricingDto;
import com.adikabuyer.catalog.service.CatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/products")
    public ProductPageResponse getAllProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) BigDecimal volumeMin,
            @RequestParam(required = false) BigDecimal volumeMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "1000") int pageSize,
            @RequestParam(defaultValue = "false") boolean includeArchived
    ) {
        return catalogService.getAllProducts(
                search, category, color, size, volumeMin, volumeMax, page, pageSize, includeArchived
        );
    }

    @GetMapping("/categories")
    public List<String> getCategories(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) BigDecimal volumeMin,
            @RequestParam(required = false) BigDecimal volumeMax
    ) {
        return catalogService.getCategories(search, color, size, volumeMin, volumeMax);
    }

    @GetMapping("/products/{id}")
    public ProductDto getProductById(@PathVariable Long id) {
        return catalogService.getProductById(id);
    }

    @GetMapping("/variants/{id}/availability")
    public boolean isVariantAvailable(@PathVariable Long id, @RequestParam(defaultValue = "1") int quantity) {
        return catalogService.isVariantAvailable(id, quantity);
    }

    @GetMapping("/variants/pricing")
    public List<VariantPricingDto> getVariantPricing(@RequestParam(required = false) List<Long> ids) {
        return ids == null || ids.isEmpty() ? List.of() : catalogService.getVariantPricing(ids);
    }

    @PostMapping("/products")
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createProduct(request));
    }

    @PutMapping("/products/{id}")
    public ProductDto updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return catalogService.updateProduct(id, request);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        catalogService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    /** Drops one variant and returns the product as it now stands (never the last variant). */
    @DeleteMapping("/products/{productId}/variants/{variantId}")
    public ProductDto deleteVariant(@PathVariable Long productId, @PathVariable Long variantId) {
        return catalogService.deleteVariant(productId, variantId);
    }
}
