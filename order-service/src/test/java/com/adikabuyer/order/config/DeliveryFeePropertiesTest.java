package com.adikabuyer.order.config;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class DeliveryFeePropertiesTest {

    @Test
    void exposesConfiguredBishkekAndPickupFees() {
        DeliveryFeeProperties properties = new DeliveryFeeProperties();
        properties.setBishkekFee(BigDecimal.valueOf(300));
        properties.setPickupFee(BigDecimal.ZERO);

        assertThat(properties.getBishkekFee()).isEqualByComparingTo(BigDecimal.valueOf(300));
        assertThat(properties.getPickupFee()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
