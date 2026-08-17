package com.adikabuyer.catalog.service;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.dto.ProductRequest;
import com.adikabuyer.catalog.dto.VariantRequest;
import com.adikabuyer.catalog.exception.OutOfStockException;
import com.adikabuyer.catalog.mapper.ProductMapper;
import com.adikabuyer.catalog.repository.ProductRepository;
import com.adikabuyer.catalog.repository.VariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private static final int DEFAULT_VARIANT_STOCK = 100;

    private final ProductRepository productRepository;
    private final VariantRepository variantRepository;
    private final ProductMapper productMapper;

    public List<ProductDto> getAllProducts(String search, String color, String size, String volume) {
        return productRepository.search(
                        normalize(search),
                        normalize(color),
                        normalize(size),
                        normalize(volume)
                )
                .stream()
                .map(productMapper::toDto)
                .toList();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public ProductDto getProductById(Long id) {
        return productRepository.findById(id)
                .map(productMapper::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
    }

    public boolean isVariantAvailable(Long variantId, int requestedQuantity) {
        if (requestedQuantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested quantity must be positive");
        }
        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variant not found: " + variantId));
        if (!variant.isActive() || variant.getStockQuantity() < requestedQuantity) {
            throw new OutOfStockException("Variant out of stock: " + variantId);
        }
        return true;
    }

    @Transactional
    public ProductDto createProduct(ProductRequest request) {
        Instant now = Instant.now();

        Product product = Product.builder()
                .name(request.name())
                .description(request.description())
                .category(request.category())
                .basePrice(request.basePrice())
                .active(request.active())
                .imageUrl(request.imageUrl())
                .createdAt(now)
                .updatedAt(now)
                .variants(new ArrayList<>())
                .build();

        for (VariantRequest variantRequest : nullSafeVariants(request)) {
            product.getVariants().add(buildVariant(variantRequest, product, now));
        }

        if (product.getVariants().isEmpty()) {
            product.getVariants().add(buildDefaultVariant(product, now));
        }

        return productMapper.toDto(saveOrConflict(product));
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));

        Instant now = Instant.now();

        product.setName(request.name());
        product.setDescription(request.description());
        product.setCategory(request.category());
        product.setBasePrice(request.basePrice());
        product.setActive(request.active());
        product.setImageUrl(request.imageUrl());
        product.setUpdatedAt(now);

        reconcileVariants(product, nullSafeVariants(request), now);

        return productMapper.toDto(saveOrConflict(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
        productRepository.delete(product);
    }

    private void reconcileVariants(Product product, List<VariantRequest> variantRequests, Instant now) {
        Map<Long, Variant> existingById = new HashMap<>();
        for (Variant variant : product.getVariants()) {
            existingById.put(variant.getId(), variant);
        }

        List<Variant> reconciled = new ArrayList<>();
        for (VariantRequest variantRequest : variantRequests) {
            if (variantRequest.id() == null) {
                reconciled.add(buildVariant(variantRequest, product, now));
                continue;
            }

            Variant existing = existingById.get(variantRequest.id());
            if (existing == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Variant not found: " + variantRequest.id());
            }

            applyVariantRequest(existing, variantRequest, now);
            reconciled.add(existing);
        }

        product.getVariants().clear();
        product.getVariants().addAll(reconciled);
    }

    private Variant buildVariant(VariantRequest request, Product product, Instant now) {
        return Variant.builder()
                .product(product)
                .sku(request.sku())
                .attributes(request.attributes() != null ? request.attributes() : new HashMap<>())
                .priceOverride(request.priceOverride())
                .stockQuantity(request.stockQuantity())
                .active(request.active())
                .imageUrl(request.imageUrl())
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private Variant buildDefaultVariant(Product product, Instant now) {
        return Variant.builder()
                .product(product)
                .sku("DEFAULT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .attributes(new HashMap<>())
                .priceOverride(null)
                .stockQuantity(DEFAULT_VARIANT_STOCK)
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private void applyVariantRequest(Variant variant, VariantRequest request, Instant now) {
        variant.setSku(request.sku());
        variant.setAttributes(request.attributes() != null ? request.attributes() : new HashMap<>());
        variant.setPriceOverride(request.priceOverride());
        variant.setStockQuantity(request.stockQuantity());
        variant.setActive(request.active());
        variant.setImageUrl(request.imageUrl());
        variant.setUpdatedAt(now);
    }

    private List<VariantRequest> nullSafeVariants(ProductRequest request) {
        return request.variants() != null ? request.variants() : List.of();
    }

    private Product saveOrConflict(Product product) {
        try {
            return productRepository.save(product);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "One or more variant SKUs already exist");
        }
    }
}
