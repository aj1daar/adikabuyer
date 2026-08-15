package com.adikabuyer.catalog.service;

import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.exception.OutOfStockException;
import com.adikabuyer.catalog.mapper.ProductMapper;
import com.adikabuyer.catalog.repository.ProductRepository;
import com.adikabuyer.catalog.repository.VariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private VariantRepository variantRepository;

    @Mock
    private ProductMapper productMapper;

    private CatalogService catalogService;

    @BeforeEach
    void setUp() {
        catalogService = new CatalogService(productRepository, variantRepository, productMapper);
    }

    @Test
    void isVariantAvailable_throwsOutOfStockException_whenStockIsZero() {
        Variant variant = Variant.builder()
                .id(1L)
                .sku("SKU-1")
                .stockQuantity(0)
                .active(true)
                .build();

        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        assertThatThrownBy(() -> catalogService.isVariantAvailable(1L, 1))
                .isInstanceOf(OutOfStockException.class);
    }

    @Test
    void isVariantAvailable_returnsTrue_whenStockCoversRequestedQuantity() {
        Variant variant = Variant.builder()
                .id(2L)
                .sku("SKU-2")
                .stockQuantity(5)
                .active(true)
                .build();

        when(variantRepository.findById(2L)).thenReturn(Optional.of(variant));

        assertThat(catalogService.isVariantAvailable(2L, 3)).isTrue();
    }
}
