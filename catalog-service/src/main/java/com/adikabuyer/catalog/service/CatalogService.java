package com.adikabuyer.catalog.service;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.domain.VariantStatus;
import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.dto.ProductPageResponse;
import com.adikabuyer.catalog.dto.ProductRequest;
import com.adikabuyer.catalog.dto.VariantPricingDto;
import com.adikabuyer.catalog.dto.VariantRequest;
import com.adikabuyer.catalog.exception.OutOfStockException;
import com.adikabuyer.catalog.mapper.ProductMapper;
import com.adikabuyer.catalog.media.S3StorageService;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final ProductRepository productRepository;
    private final VariantRepository variantRepository;
    private final ProductMapper productMapper;
    private final S3StorageService s3StorageService;

    public ProductPageResponse getAllProducts(
            String search, String category, String color, String size, BigDecimal volumeMin, BigDecimal volumeMax,
            int page, int pageSize, boolean includeArchived
    ) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Product> result = productRepository.search(
                normalize(search),
                normalize(category),
                normalize(color),
                normalize(size),
                volumeMin,
                volumeMax,
                includeArchived,
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
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
        if (isArchived(product)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id);
        }
        return productMapper.toDto(product);
    }

    private boolean isArchived(Product product) {
        return !product.getVariants().isEmpty()
                && product.getVariants().stream().allMatch(variant -> variant.getStatus() == VariantStatus.SOLD_OUT);
    }

    @Transactional(readOnly = true)
    public List<VariantPricingDto> getVariantPricing(List<Long> variantIds) {
        return variantRepository.findAllById(variantIds).stream()
                .map(variant -> new VariantPricingDto(
                        variant.getId(),
                        variant.getProduct().getName(),
                        variant.getSku(),
                        variant.getPriceOverride(),
                        variant.getStockQuantity(),
                        variant.isActive(),
                        variant.getStatus()
                ))
                .toList();
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
                .brand(normalize(request.brand()))
                .active(request.active())
                .createdAt(now)
                .updatedAt(now)
                .variants(new ArrayList<>())
                .build();

        Set<String> usedSkus = new HashSet<>();
        for (VariantRequest variantRequest : variantRequests) {
            Variant variant = VariantReconciler.buildVariant(variantRequest, product, now, skuGuard(usedSkus));
            usedSkus.add(variant.getSku());
            product.getVariants().add(variant);
        }

        product.setBasePrice(deriveBasePrice(product.getVariants()));
        product.setImageUrl(deriveImageUrl(product.getVariants()));
        product.setColorSwatches(pruneColorSwatches(request.colorSwatches(), product.getVariants()));
        product.setLabels(cleanLabels(request.labels()));

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
        product.setBrand(normalize(request.brand()));
        product.setActive(request.active());
        product.setUpdatedAt(now);

        VariantReconciler.reconcile(product, variantRequests, now, variantRepository::existsBySkuIgnoreCase);

        product.setBasePrice(deriveBasePrice(product.getVariants()));
        product.setImageUrl(deriveImageUrl(product.getVariants()));
        // null means "not sent" — leave the existing value alone; an explicit empty
        // map/list is how a caller clears it.
        if (request.colorSwatches() != null) {
            product.setColorSwatches(pruneColorSwatches(request.colorSwatches(), product.getVariants()));
        }
        if (request.labels() != null) {
            product.setLabels(cleanLabels(request.labels()));
        }

        return productMapper.toDto(saveOrConflict(product));
    }

    private Map<String, String> pruneColorSwatches(Map<String, String> requested, List<Variant> variants) {
        if (requested == null || requested.isEmpty()) {
            return new HashMap<>();
        }
        Set<String> colours = variants.stream()
                .map(variant -> variant.getAttributes().get("color"))
                .filter(Objects::nonNull)
                .map(String::valueOf)
                .collect(Collectors.toSet());
        Map<String, String> kept = new HashMap<>();
        requested.forEach((colour, url) -> {
            if (colours.contains(colour) && url != null && !url.isBlank()) {
                kept.put(colour, url);
            }
        });
        return kept;
    }

    private List<String> cleanLabels(List<String> requested) {
        if (requested == null) {
            return new ArrayList<>();
        }
        List<String> kept = new ArrayList<>();
        for (String raw : requested) {
            if (raw == null) {
                continue;
            }
            String label = raw.trim();
            if (!label.isEmpty() && !kept.contains(label)) {
                kept.add(label);
            }
        }
        return kept;
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

        // collect before the delete — afterwards the entity's collections are gone
        Set<String> media = new LinkedHashSet<>();
        product.getVariants().forEach(variant -> media.addAll(variant.getImageUrls()));
        media.addAll(product.getColorSwatches().values());

        productRepository.delete(product);
        s3StorageService.deleteFiles(media);
    }

    /**
     * Drops a single variant off a product, keeping the product itself. The last variant
     * can't go this way — a product without variants has no price and no way back through
     * the admin form, so that case has to be an explicit "delete the whole product".
     */
    @Transactional
    public ProductDto deleteVariant(Long productId, Long variantId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found: " + productId));

        Variant variant = product.getVariants().stream()
                .filter(candidate -> Objects.equals(candidate.getId(), variantId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Variant " + variantId + " does not belong to product " + productId));

        if (product.getVariants().size() <= 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This is the product's only variant — delete the product instead");
        }

        Set<String> media = new LinkedHashSet<>(variant.getImageUrls());
        Map<String, String> swatchesBefore = product.getColorSwatches();

        // orphanRemoval on Product.variants turns this into the row delete on save
        product.getVariants().remove(variant);
        product.setBasePrice(deriveBasePrice(product.getVariants()));
        product.setImageUrl(deriveImageUrl(product.getVariants()));
        product.setColorSwatches(pruneColorSwatches(swatchesBefore, product.getVariants()));
        product.setUpdatedAt(Instant.now());

        // a colour whose last variant just went takes its swatch image with it
        Map<String, String> swatchesAfter = product.getColorSwatches();
        swatchesBefore.forEach((colour, url) -> {
            if (!swatchesAfter.containsKey(colour)) {
                media.add(url);
            }
        });

        ProductDto dto = productMapper.toDto(saveOrConflict(product));
        s3StorageService.deleteFiles(media);
        return dto;
    }

    private Predicate<String> skuGuard(Set<String> used) {
        return sku -> used.contains(sku) || variantRepository.existsBySkuIgnoreCase(sku);
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
