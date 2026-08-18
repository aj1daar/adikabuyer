package com.adikabuyer.catalog.util;

import com.adikabuyer.catalog.domain.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class PriceCalculator {

    private static final BigDecimal COMMISSION_MULTIPLIER = BigDecimal.valueOf(115, 2);
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private PriceCalculator() {
    }

    public static BigDecimal computeDisplayPrice(BigDecimal originalPrice) {
        if (originalPrice == null) {
            return null;
        }
        BigDecimal withCommission = originalPrice.multiply(COMMISSION_MULTIPLIER);
        return withCommission
                .divide(HUNDRED, 0, RoundingMode.HALF_UP)
                .multiply(HUNDRED);
    }

    public static BigDecimal computeVariantDisplayPrice(BigDecimal priceOverride, Product product) {
        BigDecimal original = priceOverride != null
                ? priceOverride
                : (product != null ? product.getBasePrice() : null);
        return computeDisplayPrice(original);
    }
}
