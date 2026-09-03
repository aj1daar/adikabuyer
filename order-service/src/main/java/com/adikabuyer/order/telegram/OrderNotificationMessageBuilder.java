package com.adikabuyer.order.telegram;

import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CartItemDto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.TreeMap;

public final class OrderNotificationMessageBuilder {

    private static final char NBSP = ' ';
    private static final String DEFAULT_SKU_PREFIX = "DEFAULT-";

    private OrderNotificationMessageBuilder() {
    }

    public static String buildOrderMessage(
            String orderId, CartDto cart, List<CartItemDto> items,
            BigDecimal itemsTotal, BigDecimal deliveryFee, BigDecimal grandTotal
    ) {
        StringBuilder message = new StringBuilder();
        message.append("Новый заказ ").append(orderId).append('\n');
        message.append("Имя: ").append(cart.customerName()).append('\n');
        message.append("Телефон: ").append(cart.customerPhone()).append('\n');
        message.append("Город: ").append(cart.region()).append("\n\n");

        for (CartItemDto item : items) {
            message.append(buildItemLine(item)).append('\n');
        }

        message.append('\n').append("Товары: ").append(formatPrice(itemsTotal)).append('\n');
        message.append("Доставка: ").append(formatPrice(deliveryFee)).append('\n');
        message.append("Итого: ").append(formatPrice(grandTotal));

        return message.toString();
    }

    private static String buildItemLine(CartItemDto item) {
        BigDecimal lineTotal = item.unitPrice().multiply(BigDecimal.valueOf(item.quantity()));
        StringBuilder line = new StringBuilder();
        line.append(item.quantity()).append("x ").append(item.productName());

        String details = describeVariant(item);
        if (!details.isEmpty()) {
            line.append(" (").append(details).append(')');
        }

        return line.append(" — ").append(formatPrice(lineTotal)).toString();
    }

    private static String describeVariant(CartItemDto item) {
        List<String> parts = new ArrayList<>();
        if (item.attributes() != null) {
            new TreeMap<>(item.attributes()).values().stream()
                    .filter(Objects::nonNull)
                    .map(String::valueOf)
                    .forEach(parts::add);
        }
        if (item.sku() != null && !item.sku().startsWith(DEFAULT_SKU_PREFIX)) {
            parts.add(item.sku());
        }
        return String.join(", ", parts);
    }

    private static String formatPrice(BigDecimal value) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.ROOT);
        symbols.setGroupingSeparator(NBSP);
        DecimalFormat format = new DecimalFormat("#,##0", symbols);
        format.setRoundingMode(RoundingMode.HALF_UP);
        return format.format(value) + NBSP + "KGS";
    }
}
