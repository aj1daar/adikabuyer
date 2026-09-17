package com.adikabuyer.order.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class OrderStatusTest {

    @ParameterizedTest
    @CsvSource({
            "NEW, CONFIRMED", "CONFIRMED, PURCHASED", "PURCHASED, SHIPPED", "SHIPPED, DELIVERED",
            "CONFIRMED, SHIPPED", "NEW, CANCELLED", "SHIPPED, CANCELLED"
    })
    void allowsForwardMovesAndCancelling(OrderStatus from, OrderStatus to) {
        assertThat(from.canTransitionTo(to)).isTrue();
    }

    @ParameterizedTest
    @CsvSource({
            "CONFIRMED, NEW", "SHIPPED, PURCHASED", "NEW, NEW",
            "DELIVERED, CANCELLED", "CANCELLED, NEW", "CANCELLED, CONFIRMED"
    })
    void rejectsBackwardMovesSameStatusAndLeavingAFinalStatus(OrderStatus from, OrderStatus to) {
        assertThat(from.canTransitionTo(to)).isFalse();
    }

    @Test
    void onlyDeliveredAndCancelledAreFinal() {
        assertThat(OrderStatus.DELIVERED.isFinal()).isTrue();
        assertThat(OrderStatus.CANCELLED.isFinal()).isTrue();
        assertThat(OrderStatus.SHIPPED.isFinal()).isFalse();
        assertThat(OrderStatus.NEW.canTransitionTo(null)).isFalse();
    }
}
