package com.adikabuyer.order.dto;

import com.adikabuyer.order.domain.OrderStatus;

/** Admin edit of an order; every field is optional and only the ones sent are applied. */
public record OrderUpdateRequest(
        OrderStatus status
) {
}
