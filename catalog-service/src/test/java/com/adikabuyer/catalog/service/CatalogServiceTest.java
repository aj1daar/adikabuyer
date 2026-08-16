package com.adikabuyer.catalog.service;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.exception.OutOfStockException;
import com.adikabuyer.catalog.mapper.ProductMapper;
import com.adikabuyer.catalog.repository.ProductRepository;
import com.adikabuyer.catalog.repository.VariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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
    void getAllProducts_returnsMappedDtos_whenRepositoryHasProducts() {
        Product product = Product.builder().id(1L).name("Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        ProductDto dto = new ProductDto(1L, "Tumbler", null, null, BigDecimal.TEN, true, List.of());

        when(productRepository.findAll()).thenReturn(List.of(product));
        when(productMapper.toDto(product)).thenReturn(dto);

        List<ProductDto> result = catalogService.getAllProducts();

        assertThat(result).containsExactly(dto);
    }

    @Test
    void getAllProducts_returnsEmptyList_whenRepositoryIsEmpty() {
        when(productRepository.findAll()).thenReturn(List.of());

        assertThat(catalogService.getAllProducts()).isEmpty();
    }

    @Test
    void getProductById_returnsDto_whenProductExists() {
        Product product = Product.builder().id(1L).name("Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        ProductDto dto = new ProductDto(1L, "Tumbler", null, null, BigDecimal.TEN, true, List.of());

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productMapper.toDto(product)).thenReturn(dto);

        assertThat(catalogService.getProductById(1L)).isEqualTo(dto);
    }

    @Test
    void getProductById_throwsNotFound_whenProductMissing() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> catalogService.getProductById(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void isVariantAvailable_throwsNotFound_whenVariantMissing() {
        when(variantRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> catalogService.isVariantAvailable(1L, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void isVariantAvailable_throwsOutOfStockException_whenStockIsZero() {
        Variant variant = Variant.builder().id(1L).sku("SKU-1").stockQuantity(0).active(true).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        assertThatThrownBy(() -> catalogService.isVariantAvailable(1L, 1))
                .isInstanceOf(OutOfStockException.class);
    }

    @Test
    void isVariantAvailable_throwsOutOfStockException_whenVariantIsInactiveDespiteStock() {
        Variant variant = Variant.builder().id(1L).sku("SKU-1").stockQuantity(100).active(false).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        assertThatThrownBy(() -> catalogService.isVariantAvailable(1L, 1))
                .isInstanceOf(OutOfStockException.class);
    }

    @Test
    void isVariantAvailable_returnsTrue_whenStockExactlyMatchesRequestedQuantity() {
        Variant variant = Variant.builder().id(1L).sku("SKU-1").stockQuantity(3).active(true).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        assertThat(catalogService.isVariantAvailable(1L, 3)).isTrue();
    }

    @Test
    void isVariantAvailable_returnsTrue_whenStockCoversRequestedQuantity() {
        Variant variant = Variant.builder().id(2L).sku("SKU-2").stockQuantity(5).active(true).build();
        when(variantRepository.findById(2L)).thenReturn(Optional.of(variant));

        assertThat(catalogService.isVariantAvailable(2L, 3)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, -1000})
    void isVariantAvailable_rejectsNonPositiveRequestedQuantity_withoutTouchingRepository(int requestedQuantity) {
        assertThatThrownBy(() -> catalogService.isVariantAvailable(1L, requestedQuantity))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");

        verifyNoInteractions(variantRepository);
    }

    @Test
    void isVariantAvailable_publishesLookupOnlyOnce() {
        Variant variant = Variant.builder().id(1L).sku("SKU-1").stockQuantity(10).active(true).build();
        when(variantRepository.findById(1L)).thenReturn(Optional.of(variant));

        catalogService.isVariantAvailable(1L, 1);

        verify(variantRepository).findById(1L);
    }

}
