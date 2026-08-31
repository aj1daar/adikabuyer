package com.adikabuyer.catalog.util;

import com.adikabuyer.catalog.domain.Product;

import java.math.BigDecimal;

/**
 * The admin now enters the final customer price directly, so {@code displayPrice}
 * is just the variant's own price (or the product's cheapest, as a fallback).
 */
public final class PriceCalculator {

    private PriceCalculator() {
    }

    public static BigDecimal computeDisplayPrice(BigDecimal price) {
        return price;
    }

    public static BigDecimal computeVariantDisplayPrice(BigDecimal priceOverride, Product product) {
        if (priceOverride != null) {
            return priceOverride;
        }
        return product != null ? product.getBasePrice() : null;
    }
}
