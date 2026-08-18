package com.adikabuyer.order.config;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class DeliveryFeePropertiesTest {

    @Test
    void exposesConfiguredDefaultFeeAndBishkekFee() {
        DeliveryFeeProperties properties = new DeliveryFeeProperties();
        properties.setDefaultFee(BigDecimal.valueOf(500));
        properties.setBishkekFee(BigDecimal.valueOf(250));

        assertThat(properties.getDefaultFee()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(properties.getBishkekFee()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }
}
