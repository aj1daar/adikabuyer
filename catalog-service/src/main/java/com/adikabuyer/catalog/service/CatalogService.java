package com.adikabuyer.catalog.service;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.domain.VariantStatus;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CatalogService {

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
            product.getVariants().add(buildVariant(variantRequest, product, now));
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

        reconcileVariants(product, variantRequests, now);

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
                .stockQuantity(resolveStockQuantity(request))
                .active(request.active())
                .imageUrls(request.imageUrls() != null ? new ArrayList<>(request.imageUrls()) : new ArrayList<>())
                .status(request.statusOrDefault())
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private void applyVariantRequest(Variant variant, VariantRequest request, Instant now) {
        variant.setSku(request.sku());
        variant.setAttributes(request.attributes() != null ? request.attributes() : new HashMap<>());
        variant.setPriceOverride(request.priceOverride());
        variant.setStockQuantity(resolveStockQuantity(request));
        variant.setActive(request.active());
        variant.setImageUrls(request.imageUrls() != null ? new ArrayList<>(request.imageUrls()) : new ArrayList<>());
        variant.setStatus(request.statusOrDefault());
        variant.setUpdatedAt(now);
    }

    private Integer resolveStockQuantity(VariantRequest request) {
        return request.statusOrDefault() == VariantStatus.PRE_ORDER ? 0 : request.stockQuantity();
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
