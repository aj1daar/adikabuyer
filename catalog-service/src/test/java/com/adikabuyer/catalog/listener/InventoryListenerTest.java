package com.adikabuyer.catalog.listener;

import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.domain.VariantStatus;
import com.adikabuyer.catalog.event.OrderItemEvent;
import com.adikabuyer.catalog.event.OrderPlacedEvent;
import com.adikabuyer.catalog.repository.ProcessedOrderEventRepository;
import com.adikabuyer.catalog.repository.VariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryListenerTest {

    @Mock
    private VariantRepository variantRepository;

    @Mock
    private ProcessedOrderEventRepository processedOrderEventRepository;

    private InventoryListener inventoryListener;

    @BeforeEach
    void setUp() {
        inventoryListener = new InventoryListener(variantRepository, processedOrderEventRepository);
    }

    private OrderItemEvent buildItem(Long variantId, int quantity) {
        return new OrderItemEvent(variantId, "Custom Tumbler", "TUM-BLK-500", Map.of("color", "black"), BigDecimal.TEN, quantity);
    }

    private OrderPlacedEvent buildEvent(OrderItemEvent... items) {
        return new OrderPlacedEvent(
                "order-1", "John Doe", "996700123456", "bishkek",
                List.of(items), BigDecimal.TEN, BigDecimal.ZERO, BigDecimal.TEN, Instant.now()
        );
    }

    @Test
    void handleOrderPlaced_decrementsStock_whenVariantHasEnoughInventory() {
        Variant variant = Variant.builder().id(1L).stockQuantity(10).status(VariantStatus.IN_STOCK).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        inventoryListener.handleOrderPlaced(buildEvent(buildItem(1L, 3)));

        assertThat(variant.getStockQuantity()).isEqualTo(7);
        assertThat(variant.getStatus()).isEqualTo(VariantStatus.IN_STOCK);
        verify(variantRepository).save(variant);
    }

    @Test
    void handleOrderPlaced_setsPreOrderStatus_whenStockReachesExactlyZero() {
        Variant variant = Variant.builder().id(1L).stockQuantity(5).status(VariantStatus.IN_STOCK).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        inventoryListener.handleOrderPlaced(buildEvent(buildItem(1L, 5)));

        assertThat(variant.getStockQuantity()).isZero();
        assertThat(variant.getStatus()).isEqualTo(VariantStatus.PRE_ORDER);
    }

    @Test
    void handleOrderPlaced_clampsStockAtZero_whenOrderedQuantityExceedsAvailableStock() {
        Variant variant = Variant.builder().id(1L).stockQuantity(2).status(VariantStatus.IN_STOCK).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        inventoryListener.handleOrderPlaced(buildEvent(buildItem(1L, 100)));

        assertThat(variant.getStockQuantity()).isZero();
        assertThat(variant.getStatus()).isEqualTo(VariantStatus.PRE_ORDER);
    }

    @Test
    void handleOrderPlaced_doesNotChangeStatus_whenStockRemainsAboveZero() {
        Variant variant = Variant.builder().id(1L).stockQuantity(10).status(VariantStatus.IN_STOCK).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        inventoryListener.handleOrderPlaced(buildEvent(buildItem(1L, 1)));

        assertThat(variant.getStockQuantity()).isEqualTo(9);
        assertThat(variant.getStatus()).isEqualTo(VariantStatus.IN_STOCK);
    }

    @Test
    void handleOrderPlaced_skipsGracefully_whenVariantIsUnknown() {
        when(variantRepository.findById(999L)).thenReturn(Optional.empty());

        inventoryListener.handleOrderPlaced(buildEvent(buildItem(999L, 1)));

        verify(variantRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void handleOrderPlaced_processesEachItemIndependently_whenOneVariantIsUnknown() {
        Variant knownVariant = Variant.builder().id(1L).stockQuantity(10).status(VariantStatus.IN_STOCK).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(knownVariant));
        when(variantRepository.findById(999L)).thenReturn(Optional.empty());

        inventoryListener.handleOrderPlaced(buildEvent(buildItem(999L, 1), buildItem(1L, 4)));

        assertThat(knownVariant.getStockQuantity()).isEqualTo(6);
        verify(variantRepository, times(1)).save(knownVariant);
    }

    @Test
    void handleOrderPlaced_marksOrderAsProcessed_afterDeductingStock() {
        Variant variant = Variant.builder().id(1L).stockQuantity(10).status(VariantStatus.IN_STOCK).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        inventoryListener.handleOrderPlaced(buildEvent(buildItem(1L, 3)));

        ArgumentCaptor<com.adikabuyer.catalog.domain.ProcessedOrderEvent> processedCaptor =
                ArgumentCaptor.forClass(com.adikabuyer.catalog.domain.ProcessedOrderEvent.class);
        verify(processedOrderEventRepository).save(processedCaptor.capture());
        assertThat(processedCaptor.getValue().getOrderId()).isEqualTo("order-1");
    }

    @Test
    void handleOrderPlaced_skipsDeduction_whenOrderWasAlreadyProcessed() {
        when(processedOrderEventRepository.existsById("order-1")).thenReturn(true);

        inventoryListener.handleOrderPlaced(buildEvent(buildItem(1L, 3)));

        verify(variantRepository, never()).findById(any());
        verify(variantRepository, never()).save(any());
        verify(processedOrderEventRepository, never()).save(any());
    }

    @Test
    void handleOrderPlaced_deductsEachLineItemAgainstItsOwnVariant() {
        Variant first = Variant.builder().id(1L).stockQuantity(10).status(VariantStatus.IN_STOCK).build();
        Variant second = Variant.builder().id(2L).stockQuantity(3).status(VariantStatus.IN_STOCK).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(first));
        when(variantRepository.findById(2L)).thenReturn(Optional.of(second));

        inventoryListener.handleOrderPlaced(buildEvent(buildItem(1L, 2), buildItem(2L, 3)));

        ArgumentCaptor<Variant> savedCaptor = ArgumentCaptor.forClass(Variant.class);
        verify(variantRepository, times(2)).save(savedCaptor.capture());

        assertThat(first.getStockQuantity()).isEqualTo(8);
        assertThat(second.getStockQuantity()).isZero();
        assertThat(second.getStatus()).isEqualTo(VariantStatus.PRE_ORDER);
    }
}
