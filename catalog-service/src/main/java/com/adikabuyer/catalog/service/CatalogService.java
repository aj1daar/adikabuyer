package com.adikabuyer.catalog.service;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.dto.ProductPageResponse;
import com.adikabuyer.catalog.dto.ProductRequest;
import com.adikabuyer.catalog.dto.VariantRequest;
import com.adikabuyer.catalog.exception.OutOfStockException;
import com.adikabuyer.catalog.mapper.ProductMapper;
import com.adikabuyer.catalog.repository.ProductRepository;
import com.adikabuyer.catalog.repository.VariantRepository;
import com.adikabuyer.catalog.util.VariantReconciler;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final ProductRepository productRepository;
    private final VariantRepository variantRepository;
    private final ProductMapper productMapper;

    public ProductPageResponse getAllProducts(
            String search, String category, String color, String size, BigDecimal volumeMin, BigDecimal volumeMax,
            int page, int pageSize
    ) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Product> result = productRepository.search(
                normalize(search),
                normalize(category),
                normalize(color),
                normalize(size),
                volumeMin,
                volumeMax,
                pageable
        );
        List<ProductDto> items = result.getContent().stream().map(productMapper::toDto).toList();
        return new ProductPageResponse(items, result.getTotalElements(), page, pageSize);
    }

    public List<String> getCategories(String search, String color, String size, BigDecimal volumeMin, BigDecimal volumeMax) {
        return productRepository.findDistinctCategories(
                normalize(search), normalize(color), normalize(size), volumeMin, volumeMax
        );
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
        List<VariantRequest> variantRequests = nullSafeVariants(request);
        requireVariants(variantRequests);

        Instant now = Instant.now();

        Product product = Product.builder()
                .name(request.name())
                .description(request.description())
                .category(request.category())
                .active(request.active())
                .createdAt(now)
                .updatedAt(now)
                .variants(new ArrayList<>())
                .build();

        for (VariantRequest variantRequest : variantRequests) {
            product.getVariants().add(VariantReconciler.buildVariant(variantRequest, product, now));
        }

        product.setBasePrice(deriveBasePrice(product.getVariants()));
        product.setImageUrl(deriveImageUrl(product.getVariants()));

        return productMapper.toDto(saveOrConflict(product));
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));

        List<VariantRequest> variantRequests = nullSafeVariants(request);
        requireVariants(variantRequests);

        Instant now = Instant.now();

        product.setName(request.name());
        product.setDescription(request.description());
        product.setCategory(request.category());
        product.setActive(request.active());
        product.setUpdatedAt(now);

        VariantReconciler.reconcile(product, variantRequests, now);

        product.setBasePrice(deriveBasePrice(product.getVariants()));
        product.setImageUrl(deriveImageUrl(product.getVariants()));

        return productMapper.toDto(saveOrConflict(product));
    }

    private void requireVariants(List<VariantRequest> variantRequests) {
        if (variantRequests.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A product needs at least one variant");
        }
    }

    private BigDecimal deriveBasePrice(List<Variant> variants) {
        return variants.stream()
                .map(Variant::getPriceOverride)
                .min(Comparator.naturalOrder())
                .orElseThrow();
    }

    private String deriveImageUrl(List<Variant> variants) {
        return variants.stream()
                .flatMap(variant -> variant.getImageUrls().stream())
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
        productRepository.delete(product);
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
