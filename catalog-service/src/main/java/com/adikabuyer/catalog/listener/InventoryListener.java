package com.adikabuyer.catalog.listener;

import com.adikabuyer.catalog.domain.OrderStockDeduction;
import com.adikabuyer.catalog.domain.ProcessedOrderEvent;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.domain.VariantStatus;
import com.adikabuyer.catalog.event.OrderCancelledEvent;
import com.adikabuyer.catalog.event.OrderItemEvent;
import com.adikabuyer.catalog.event.OrderPlacedEvent;
import com.adikabuyer.catalog.repository.OrderStockDeductionRepository;
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
    private final OrderStockDeductionRepository orderStockDeductionRepository;

    @RabbitListener(queues = "${app.rabbitmq.queue}")
    @Transactional
    public void handleOrderPlaced(OrderPlacedEvent event) {
        if (processedOrderEventRepository.existsById(event.orderId())) {
            log.info("Order {} was already processed, skipping duplicate delivery", event.orderId());
            return;
        }

        for (OrderItemEvent item : event.items()) {
            applyStockDeduction(event.orderId(), item);
        }

        processedOrderEventRepository.save(
                ProcessedOrderEvent.builder().orderId(event.orderId()).processedAt(Instant.now()).build()
        );
    }

    private void applyStockDeduction(String orderId, OrderItemEvent item) {
        variantRepository.findById(item.variantId()).ifPresentOrElse(
                variant -> deductStock(orderId, variant, item.quantity()),
                () -> log.warn("Received order event for unknown variant id {}", item.variantId())
        );
    }

    private void deductStock(String orderId, Variant variant, int quantity) {
        int remainingStock = Math.max(variant.getStockQuantity() - quantity, 0);
        int taken = variant.getStockQuantity() - remainingStock;
        variant.setStockQuantity(remainingStock);
        boolean causedSoldOut = remainingStock == 0 && variant.getStatus() == VariantStatus.IN_STOCK;
        if (causedSoldOut) {
            variant.setStatus(VariantStatus.SOLD_OUT);
            variant.setActive(false);
        }
        variantRepository.save(variant);
        if (taken > 0) {
            orderStockDeductionRepository.save(OrderStockDeduction.builder()
                    .orderId(orderId)
                    .variantId(variant.getId())
                    .quantity(taken)
                    .causedSoldOut(causedSoldOut)
                    .deductedAt(Instant.now())
                    .build());
        }
    }

    /**
     * Gives a cancelled order its stock back: exactly what the order took (see
     * {@link OrderStockDeduction}), once — redelivered events find nothing left to restore.
     * A variant only flips back from SOLD_OUT when this order was what sold it out, so a
     * variant the admin retired by hand stays retired.
     */
    @RabbitListener(queues = "${app.rabbitmq.cancel-queue}")
    @Transactional
    public void handleOrderCancelled(OrderCancelledEvent event) {
        for (OrderStockDeduction deduction : orderStockDeductionRepository.findAllByOrderIdAndRestoredAtIsNull(event.orderId())) {
            variantRepository.findById(deduction.getVariantId()).ifPresentOrElse(variant -> {
                variant.setStockQuantity(variant.getStockQuantity() + deduction.getQuantity());
                if (deduction.isCausedSoldOut() && variant.getStatus() == VariantStatus.SOLD_OUT) {
                    variant.setStatus(VariantStatus.IN_STOCK);
                    variant.setActive(true);
                }
                variantRepository.save(variant);
            }, () -> log.warn("Cannot return stock for order {}: variant {} no longer exists",
                    event.orderId(), deduction.getVariantId()));
            deduction.setRestoredAt(Instant.now());
            orderStockDeductionRepository.save(deduction);
        }
        log.info("Returned stock for cancelled order {}", event.orderId());
    }
}
