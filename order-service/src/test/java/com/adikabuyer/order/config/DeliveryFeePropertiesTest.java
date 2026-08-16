package com.adikabuyer.order.config;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DeliveryFeePropertiesTest {

    @Test
    void defaultsToEmptyFeesMap_whenConstructed() {
        DeliveryFeeProperties properties = new DeliveryFeeProperties();

        assertThat(properties.getFees()).isEmpty();
    }

    @Test
    void exposesConfiguredDefaultFeeAndRegionalFees() {
        DeliveryFeeProperties properties = new DeliveryFeeProperties();
        properties.setDefaultFee(BigDecimal.valueOf(250));
        properties.setFees(Map.of("osh", BigDecimal.valueOf(200)));

        assertThat(properties.getDefaultFee()).isEqualByComparingTo(BigDecimal.valueOf(250));
        assertThat(properties.getFees()).containsEntry("osh", BigDecimal.valueOf(200));
    }
}
