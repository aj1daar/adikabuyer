package com.adikabuyer.catalog.util;

import com.adikabuyer.catalog.domain.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PriceCalculatorTest {

    @Test
    void computeDisplayPrice_appliesFifteenPercentCommission_andRoundsToTheNearestHundred() {
        assertThat(PriceCalculator.computeDisplayPrice(BigDecimal.valueOf(2000))).isEqualByComparingTo("2300");
    }

    @Test
    void computeDisplayPrice_roundsDown_whenBelowTheMidpoint() {
        assertThat(PriceCalculator.computeDisplayPrice(BigDecimal.valueOf(1500))).isEqualByComparingTo("1700");
    }

    @Test
    void computeDisplayPrice_roundsUp_onExactMidpoint() {
        assertThat(PriceCalculator.computeDisplayPrice(BigDecimal.valueOf(1000))).isEqualByComparingTo("1200");
    }

    @Test
    void computeDisplayPrice_returnsNull_whenOriginalIsNull() {
        assertThat(PriceCalculator.computeDisplayPrice(null)).isNull();
    }

    @Test
    void computeDisplayPrice_returnsZero_whenTooSmallToClearTheFirstHundred() {
        assertThat(PriceCalculator.computeDisplayPrice(BigDecimal.valueOf(25))).isEqualByComparingTo("0");
    }

    @Test
    void computeVariantDisplayPrice_prefersPriceOverride_overProductBasePrice() {
        Product product = Product.builder().basePrice(BigDecimal.valueOf(9999)).build();

        BigDecimal result = PriceCalculator.computeVariantDisplayPrice(BigDecimal.valueOf(2000), product);

        assertThat(result).isEqualByComparingTo("2300");
    }

    @Test
    void computeVariantDisplayPrice_fallsBackToProductBasePrice_whenOverrideIsNull() {
        Product product = Product.builder().basePrice(BigDecimal.valueOf(2000)).build();

        BigDecimal result = PriceCalculator.computeVariantDisplayPrice(null, product);

        assertThat(result).isEqualByComparingTo("2300");
    }

    @Test
    void computeVariantDisplayPrice_returnsNull_whenNeitherOverrideNorProductIsAvailable() {
        assertThat(PriceCalculator.computeVariantDisplayPrice(null, null)).isNull();
    }
}
