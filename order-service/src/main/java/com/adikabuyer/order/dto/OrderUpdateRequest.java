package com.adikabuyer.order.dto;

import com.adikabuyer.order.domain.OrderStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Admin edit of an order; every field is optional and only the ones sent are applied. */
public record OrderUpdateRequest(
        OrderStatus status,
        // the parcel-weight surcharge agreed with the customer, in KGS
        @PositiveOrZero @DecimalMax("1000000") BigDecimal weightFee,
        // an empty string clears the note
        @Size(max = 1000) String adminNote
) {
    public OrderUpdateRequest(OrderStatus status) {
        this(status, null, null);
    }
}
