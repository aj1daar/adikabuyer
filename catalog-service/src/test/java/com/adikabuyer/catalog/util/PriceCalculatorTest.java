package com.adikabuyer.catalog.util;

import com.adikabuyer.catalog.domain.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PriceCalculatorTest {

    @Test
    void computeDisplayPrice_returnsThePriceUnchanged() {
        assertThat(PriceCalculator.computeDisplayPrice(BigDecimal.valueOf(2000))).isEqualByComparingTo("2000");
    }

    @Test
    void computeDisplayPrice_returnsNull_whenPriceIsNull() {
        assertThat(PriceCalculator.computeDisplayPrice(null)).isNull();
    }

    @Test
    void computeVariantDisplayPrice_usesThePriceOverride_whenPresent() {
        Product product = Product.builder().basePrice(BigDecimal.valueOf(9999)).build();

        assertThat(PriceCalculator.computeVariantDisplayPrice(BigDecimal.valueOf(2000), product))
                .isEqualByComparingTo("2000");
    }

    @Test
    void computeVariantDisplayPrice_fallsBackToProductBasePrice_whenOverrideIsNull() {
        Product product = Product.builder().basePrice(BigDecimal.valueOf(2000)).build();

        assertThat(PriceCalculator.computeVariantDisplayPrice(null, product)).isEqualByComparingTo("2000");
    }

    @Test
    void computeVariantDisplayPrice_returnsNull_whenNeitherOverrideNorProductIsAvailable() {
        assertThat(PriceCalculator.computeVariantDisplayPrice(null, null)).isNull();
    }
}
