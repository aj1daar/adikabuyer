package com.adikabuyer.order.domain;

/**
 * Where an order stands in the buyer flow: the customer is called and the order confirmed,
 * the goods are bought abroad, shipped to Бишкек and handed over. An order only moves
 * forward (skipping steps is allowed — e.g. something already in stock goes straight from
 * CONFIRMED to SHIPPED) or gets cancelled; DELIVERED and CANCELLED are final.
 */
public enum OrderStatus {
    NEW,
    CONFIRMED,
    PURCHASED,
    SHIPPED,
    DELIVERED,
    CANCELLED;

    /** Russian name shown to admins in Telegram and the admin panel. */
    public String label() {
        return switch (this) {
            case NEW -> "Новый";
            case CONFIRMED -> "Подтверждён";
            case PURCHASED -> "Выкуплен";
            case SHIPPED -> "В пути";
            case DELIVERED -> "Доставлен";
            case CANCELLED -> "Отменён";
        };
    }

    public boolean isFinal() {
        return this == DELIVERED || this == CANCELLED;
    }

    public boolean canTransitionTo(OrderStatus next) {
        if (next == null || next == this || isFinal()) {
            return false;
        }
        return next == CANCELLED || next.ordinal() > ordinal();
    }
}
