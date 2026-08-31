package com.adikabuyer.catalog.listener;

import com.adikabuyer.catalog.domain.ProcessedOrderEvent;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.domain.VariantStatus;
import com.adikabuyer.catalog.event.OrderItemEvent;
import com.adikabuyer.catalog.event.OrderPlacedEvent;
import com.adikabuyer.catalog.repository.ProcessedOrderEventRepository;
import com.adikabuyer.catalog.repository.VariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryListener {

    private final VariantRepository variantRepository;
    private final ProcessedOrderEventRepository processedOrderEventRepository;

    @RabbitListener(queues = "${app.rabbitmq.queue}")
    @Transactional
    public void handleOrderPlaced(OrderPlacedEvent event) {
        if (processedOrderEventRepository.existsById(event.orderId())) {
            log.info("Order {} was already processed, skipping duplicate delivery", event.orderId());
            return;
        }

        for (OrderItemEvent item : event.items()) {
            applyStockDeduction(item);
        }

        processedOrderEventRepository.save(
                ProcessedOrderEvent.builder().orderId(event.orderId()).processedAt(Instant.now()).build()
        );
    }

    private void applyStockDeduction(OrderItemEvent item) {
        variantRepository.findById(item.variantId()).ifPresentOrElse(
                variant -> deductStock(variant, item.quantity()),
                () -> log.warn("Received order event for unknown variant id {}", item.variantId())
        );
    }

    private void deductStock(Variant variant, int quantity) {
        int remainingStock = Math.max(variant.getStockQuantity() - quantity, 0);
        variant.setStockQuantity(remainingStock);
        if (remainingStock == 0 && variant.getStatus() == VariantStatus.IN_STOCK) {
            variant.setStatus(VariantStatus.SOLD_OUT);
        }
        variantRepository.save(variant);
    }
}
