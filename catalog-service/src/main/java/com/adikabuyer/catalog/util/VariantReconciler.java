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
import java.util.List;
import java.util.Map;

public final class VariantReconciler {

    private VariantReconciler() {
    }

    public static void reconcile(Product product, List<VariantRequest> variantRequests, Instant now) {
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

    public static Variant buildVariant(VariantRequest request, Product product, Instant now) {
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

    private static void applyVariantRequest(Variant variant, VariantRequest request, Instant now) {
        variant.setSku(request.sku());
        variant.setAttributes(request.attributes() != null ? request.attributes() : new HashMap<>());
        variant.setPriceOverride(request.priceOverride());
        variant.setStockQuantity(resolveStockQuantity(request));
        variant.setActive(request.active());
        variant.setImageUrls(request.imageUrls() != null ? new ArrayList<>(request.imageUrls()) : new ArrayList<>());
        variant.setStatus(request.statusOrDefault());
        variant.setUpdatedAt(now);
    }

    private static Integer resolveStockQuantity(VariantRequest request) {
        return request.statusOrDefault() == VariantStatus.PRE_ORDER ? 0 : request.stockQuantity();
    }
}
