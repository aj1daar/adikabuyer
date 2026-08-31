package com.adikabuyer.catalog.util;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.domain.VariantStatus;
import com.adikabuyer.catalog.dto.VariantRequest;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VariantReconcilerTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    private VariantRequest buildRequest(Long id, String sku, int stock, VariantStatus status) {
        return new VariantRequest(id, sku, Map.of("color", "black"), BigDecimal.TEN, stock, true, List.of(), status);
    }

    @Test
    void buildVariant_createsVariantLinkedToProduct_withRequestedFields() {
        Product product = Product.builder().id(1L).build();
        VariantRequest request = buildRequest(null, "SKU-1", 10, VariantStatus.IN_STOCK);

        Variant variant = VariantReconciler.buildVariant(request, product, NOW);

        assertThat(variant.getProduct()).isSameAs(product);
        assertThat(variant.getSku()).isEqualTo("SKU-1");
        assertThat(variant.getStockQuantity()).isEqualTo(10);
        assertThat(variant.getStatus()).isEqualTo(VariantStatus.IN_STOCK);
        assertThat(variant.getCreatedAt()).isEqualTo(NOW);
        assertThat(variant.getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void buildVariant_forcesStockToZero_forPreOrderVariants_regardlessOfRequestedStock() {
        Product product = Product.builder().id(1L).build();
        VariantRequest request = buildRequest(null, "SKU-1", 500, VariantStatus.PRE_ORDER);

        Variant variant = VariantReconciler.buildVariant(request, product, NOW);

        assertThat(variant.getStockQuantity()).isZero();
    }

    @Test
    void buildVariant_generatesPlaceholderSku_whenRequestSkuIsBlank() {
        Product product = Product.builder().id(1L).build();
        VariantRequest request = new VariantRequest(
                null, "   ", Map.of("color", "black"), BigDecimal.TEN, 1, true, List.of(), VariantStatus.IN_STOCK
        );

        Variant variant = VariantReconciler.buildVariant(request, product, NOW);

        assertThat(variant.getSku()).startsWith("DEFAULT-");
    }

    @Test
    void reconcile_keepsExistingSku_whenUpdateRequestSkuIsBlank() {
        Variant existing = Variant.builder().id(10L).sku("KEEP-ME").stockQuantity(2).active(true).build();
        Product product = Product.builder().id(1L).variants(new ArrayList<>(List.of(existing))).build();
        VariantRequest request = new VariantRequest(
                10L, "", Map.of("color", "black"), BigDecimal.TEN, 2, true, List.of(), VariantStatus.IN_STOCK
        );

        VariantReconciler.reconcile(product, List.of(request), NOW);

        assertThat(product.getVariants().get(0).getSku()).isEqualTo("KEEP-ME");
    }

    @Test
    void reconcile_addsNewVariant_whenRequestHasNoId() {
        Product product = Product.builder().id(1L).variants(new ArrayList<>()).build();

        VariantReconciler.reconcile(product, List.of(buildRequest(null, "NEW-SKU", 5, VariantStatus.IN_STOCK)), NOW);

        assertThat(product.getVariants()).hasSize(1);
        assertThat(product.getVariants().get(0).getSku()).isEqualTo("NEW-SKU");
        assertThat(product.getVariants().get(0).getProduct()).isSameAs(product);
    }

    @Test
    void reconcile_updatesExistingVariant_whenRequestIdMatches() {
        Variant existing = Variant.builder().id(10L).sku("OLD-SKU").stockQuantity(2).active(true).build();
        Product product = Product.builder().id(1L).variants(new ArrayList<>(List.of(existing))).build();

        VariantReconciler.reconcile(product, List.of(buildRequest(10L, "UPDATED-SKU", 20, VariantStatus.IN_STOCK)), NOW);

        assertThat(product.getVariants()).hasSize(1);
        assertThat(product.getVariants().get(0).getId()).isEqualTo(10L);
        assertThat(product.getVariants().get(0).getSku()).isEqualTo("UPDATED-SKU");
        assertThat(product.getVariants().get(0).getStockQuantity()).isEqualTo(20);
        assertThat(product.getVariants().get(0).getUpdatedAt()).isEqualTo(NOW);
    }

    @Test
    void reconcile_removesVariant_whenAbsentFromRequest() {
        Variant keep = Variant.builder().id(10L).sku("KEEP").stockQuantity(2).active(true).build();
        Variant remove = Variant.builder().id(11L).sku("TO-REMOVE").stockQuantity(2).active(true).build();
        Product product = Product.builder().id(1L).variants(new ArrayList<>(List.of(keep, remove))).build();

        VariantReconciler.reconcile(product, List.of(buildRequest(10L, "KEEP", 2, VariantStatus.IN_STOCK)), NOW);

        assertThat(product.getVariants()).hasSize(1);
        assertThat(product.getVariants().get(0).getId()).isEqualTo(10L);
    }

    @Test
    void reconcile_throwsNotFound_whenRequestIdDoesNotBelongToProduct() {
        Product product = Product.builder().id(1L).variants(new ArrayList<>()).build();
        List<VariantRequest> requests = List.of(buildRequest(999L, "GHOST-SKU", 1, VariantStatus.IN_STOCK));

        assertThatThrownBy(() -> VariantReconciler.reconcile(product, requests, NOW))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void reconcile_forcesStockToZero_forPreOrderUpdates() {
        Variant existing = Variant.builder().id(10L).sku("SKU-1").stockQuantity(50).active(true).build();
        Product product = Product.builder().id(1L).variants(new ArrayList<>(List.of(existing))).build();

        VariantReconciler.reconcile(product, List.of(buildRequest(10L, "SKU-1", 50, VariantStatus.PRE_ORDER)), NOW);

        assertThat(product.getVariants().get(0).getStockQuantity()).isZero();
    }
}
