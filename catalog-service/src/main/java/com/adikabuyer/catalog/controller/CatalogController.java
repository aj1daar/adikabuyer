package com.adikabuyer.catalog.controller;

import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/products")
    public List<ProductDto> getAllProducts() {
        return catalogService.getAllProducts();
    }

    @GetMapping("/products/{id}")
    public ProductDto getProductById(@PathVariable Long id) {
        return catalogService.getProductById(id);
    }

    @GetMapping("/variants/{id}/availability")
    public boolean isVariantAvailable(@PathVariable Long id, @RequestParam(defaultValue = "1") int quantity) {
        return catalogService.isVariantAvailable(id, quantity);
    }
}
