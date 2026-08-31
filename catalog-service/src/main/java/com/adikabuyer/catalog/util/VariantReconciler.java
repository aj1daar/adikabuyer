package com.adikabuyer.catalog.util;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.domain.VariantStatus;
import com.adikabuyer.catalog.dto.VariantRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Predicate;

public final class VariantReconciler {

    /** Attribute keys that lead a generated SKU, in this order; the rest follow sorted by key. */
    private static final List<String> SKU_ATTRIBUTE_ORDER = List.of("color", "size", "volume");

    private VariantReconciler() {
    }

    public static void reconcile(Product product, List<VariantRequest> variantRequests, Instant now) {
        reconcile(product, variantRequests, now, sku -> false);
    }

    public static void reconcile(
            Product product, List<VariantRequest> variantRequests, Instant now, Predicate<String> skuTaken
    ) {
        Map<Long, Variant> existingById = new HashMap<>();
        for (Variant variant : product.getVariants()) {
            existingById.put(variant.getId(), variant);
        }

        Set<String> usedSkus = new HashSet<>();
        List<Variant> reconciled = new ArrayList<>();
        for (VariantRequest variantRequest : variantRequests) {
            Variant variant;
            if (variantRequest.id() == null) {
                variant = buildVariant(variantRequest, product, now, guard(skuTaken, usedSkus));
            } else {
                variant = existingById.get(variantRequest.id());
                if (variant == null) {
                    throw new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Variant not found: " + variantRequest.id()
                    );
                }
                applyVariantRequest(variant, variantRequest, now, guard(skuTaken, usedSkus));
            }
            usedSkus.add(variant.getSku());
            reconciled.add(variant);
        }

        product.getVariants().clear();
        product.getVariants().addAll(reconciled);
    }

    public static Variant buildVariant(VariantRequest request, Product product, Instant now) {
        return buildVariant(request, product, now, sku -> false);
    }

    public static Variant buildVariant(
            VariantRequest request, Product product, Instant now, Predicate<String> skuTaken
    ) {
        Map<String, Object> attributes = request.attributes() != null ? request.attributes() : new HashMap<>();
        return Variant.builder()
                .product(product)
                .sku(resolveSku(request.sku(), null, attributes, skuTaken))
                .attributes(attributes)
                .priceOverride(request.priceOverride())
                .stockQuantity(resolveStockQuantity(request))
                .active(request.active())
                .imageUrls(request.imageUrls() != null ? new ArrayList<>(request.imageUrls()) : new ArrayList<>())
                .status(request.statusOrDefault())
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private static void applyVariantRequest(
            Variant variant, VariantRequest request, Instant now, Predicate<String> skuTaken
    ) {
        Map<String, Object> attributes = request.attributes() != null ? request.attributes() : new HashMap<>();
        variant.setSku(resolveSku(request.sku(), variant.getSku(), attributes, skuTaken));
        variant.setAttributes(attributes);
        variant.setPriceOverride(request.priceOverride());
        variant.setStockQuantity(resolveStockQuantity(request));
        variant.setActive(request.active());
        variant.setImageUrls(request.imageUrls() != null ? new ArrayList<>(request.imageUrls()) : new ArrayList<>());
        variant.setStatus(request.statusOrDefault());
        variant.setUpdatedAt(now);
    }

    private static Predicate<String> guard(Predicate<String> skuTaken, Set<String> usedSkus) {
        return sku -> usedSkus.contains(sku) || skuTaken.test(sku);
    }

    private static String resolveSku(
            String requested, String existing, Map<String, Object> attributes, Predicate<String> taken
    ) {
        if (requested != null && !requested.isBlank()) {
            return requested.trim();
        }
        if (existing != null && !existing.isBlank()) {
            return existing;
        }
        String base = skuFromAttributes(attributes);
        if (base.isBlank()) {
            base = "DEFAULT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        String candidate = base;
        int suffix = 2;
        while (taken.test(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private static String skuFromAttributes(Map<String, Object> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return "";
        }
        List<String> parts = new ArrayList<>();
        for (String key : SKU_ATTRIBUTE_ORDER) {
            appendPart(parts, attributes.get(key));
        }
        attributes.entrySet().stream()
                .filter(entry -> !SKU_ATTRIBUTE_ORDER.contains(entry.getKey()))
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> appendPart(parts, entry.getValue()));
        String joined = String.join("-", parts);
        return joined.length() > 90 ? joined.substring(0, 90) : joined;
    }

    private static void appendPart(List<String> parts, Object value) {
        if (value == null) {
            return;
        }
        String slug = String.valueOf(value).trim().toUpperCase().replaceAll("\\s+", "_");
        if (!slug.isEmpty()) {
            parts.add(slug);
        }
    }

    private static Integer resolveStockQuantity(VariantRequest request) {
        return request.statusOrDefault() == VariantStatus.PRE_ORDER ? 0 : request.stockQuantity();
    }
}
