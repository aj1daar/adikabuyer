package com.adikabuyer.catalog.service;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.dto.ProductRequest;
import com.adikabuyer.catalog.dto.VariantRequest;
import com.adikabuyer.catalog.exception.OutOfStockException;
import com.adikabuyer.catalog.mapper.ProductMapper;
import com.adikabuyer.catalog.repository.ProductRepository;
import com.adikabuyer.catalog.repository.VariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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
        ProductDto dto = new ProductDto(1L, "Tumbler", null, null, BigDecimal.TEN, true, null, List.of());

        when(productRepository.search(null, null, null, null)).thenReturn(List.of(product));
        when(productMapper.toDto(product)).thenReturn(dto);

        List<ProductDto> result = catalogService.getAllProducts(null, null, null, null);

        assertThat(result).containsExactly(dto);
    }

    @Test
    void getAllProducts_returnsEmptyList_whenRepositoryIsEmpty() {
        when(productRepository.search(null, null, null, null)).thenReturn(List.of());

        assertThat(catalogService.getAllProducts(null, null, null, null)).isEmpty();
    }

    @Test
    void getAllProducts_normalizesBlankFilters_toNull() {
        when(productRepository.search(null, null, null, null)).thenReturn(List.of());

        catalogService.getAllProducts("  ", "", null, "   ");

        verify(productRepository).search(null, null, null, null);
    }

    @Test
    void getAllProducts_trimsAndForwardsNonBlankFilters() {
        when(productRepository.search("tumbler", "black", "M", "500ml")).thenReturn(List.of());

        catalogService.getAllProducts(" tumbler ", " black ", " M ", " 500ml ");

        verify(productRepository).search("tumbler", "black", "M", "500ml");
    }

    @Test
    void getProductById_returnsDto_whenProductExists() {
        Product product = Product.builder().id(1L).name("Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        ProductDto dto = new ProductDto(1L, "Tumbler", null, null, BigDecimal.TEN, true, null, List.of());

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

    private VariantRequest buildVariantRequest(Long id, String sku, int stock) {
        return new VariantRequest(id, sku, Map.of("color", "black"), null, stock, true, List.of());
    }

    private ProductRequest buildProductRequest(List<VariantRequest> variants) {
        return new ProductRequest(
                "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), true,
                "http://localhost:9000/adikabuyer-media/photo.png", variants
        );
    }

    @Test
    void createProduct_savesProductWithLinkedVariants_andReturnsMappedDto() {
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ProductDto dto = new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), true, null, List.of());
        when(productMapper.toDto(any(Product.class))).thenReturn(dto);

        ProductRequest request = buildProductRequest(List.of(buildVariantRequest(null, "TUM-BLK-500", 10)));

        ProductDto result = catalogService.createProduct(request);

        ArgumentCaptor<Product> savedCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(savedCaptor.capture());

        Product saved = savedCaptor.getValue();
        assertThat(saved.getName()).isEqualTo("Custom Tumbler");
        assertThat(saved.getVariants()).hasSize(1);
        assertThat(saved.getVariants().get(0).getSku()).isEqualTo("TUM-BLK-500");
        assertThat(saved.getVariants().get(0).getProduct()).isSameAs(saved);
        assertThat(saved.getImageUrl()).isEqualTo("http://localhost:9000/adikabuyer-media/photo.png");
        assertThat(result).isEqualTo(dto);
    }

    @Test
    void createProduct_throwsConflict_whenSkuAlreadyExists() {
        when(productRepository.save(any(Product.class))).thenThrow(new DataIntegrityViolationException("duplicate key"));

        ProductRequest request = buildProductRequest(List.of(buildVariantRequest(null, "DUPLICATE-SKU", 1)));

        assertThatThrownBy(() -> catalogService.createProduct(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    void createProduct_createsDefaultVariant_whenVariantListIsEmpty() {
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), true, null, List.of())
        );

        ProductRequest request = buildProductRequest(List.of());

        catalogService.createProduct(request);

        ArgumentCaptor<Product> savedCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(savedCaptor.capture());

        Product saved = savedCaptor.getValue();
        assertThat(saved.getVariants()).hasSize(1);
        Variant defaultVariant = saved.getVariants().get(0);
        assertThat(defaultVariant.getSku()).startsWith("DEFAULT-");
        assertThat(defaultVariant.getAttributes()).isEmpty();
        assertThat(defaultVariant.getPriceOverride()).isNull();
        assertThat(defaultVariant.getStockQuantity()).isEqualTo(100);
        assertThat(defaultVariant.isActive()).isTrue();
        assertThat(defaultVariant.getProduct()).isSameAs(saved);
    }

    @Test
    void updateProduct_throwsNotFound_whenProductMissing() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> catalogService.updateProduct(99L, buildProductRequest(List.of())))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void updateProduct_updatesScalarFieldsOnExistingProduct() {
        Product existing = Product.builder().id(1L).name("Old Name").basePrice(BigDecimal.ONE).active(false).build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), true, null, List.of())
        );

        catalogService.updateProduct(1L, buildProductRequest(List.of()));

        assertThat(existing.getName()).isEqualTo("Custom Tumbler");
        assertThat(existing.getBasePrice()).isEqualByComparingTo("25");
        assertThat(existing.isActive()).isTrue();
        assertThat(existing.getImageUrl()).isEqualTo("http://localhost:9000/adikabuyer-media/photo.png");
    }

    @Test
    void updateProduct_addsNewVariant_whenRequestVariantHasNoId() {
        Product existing = Product.builder().id(1L).name("Custom Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), true, null, List.of())
        );

        catalogService.updateProduct(1L, buildProductRequest(List.of(buildVariantRequest(null, "NEW-SKU", 5))));

        assertThat(existing.getVariants()).hasSize(1);
        assertThat(existing.getVariants().get(0).getSku()).isEqualTo("NEW-SKU");
        assertThat(existing.getVariants().get(0).getProduct()).isSameAs(existing);
    }

    @Test
    void updateProduct_updatesExistingVariant_whenRequestIdMatches() {
        Variant existingVariant = Variant.builder().id(10L).sku("OLD-SKU").stockQuantity(2).active(true).build();
        Product existing = Product.builder().id(1L).name("Custom Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        existing.setVariants(new java.util.ArrayList<>(List.of(existingVariant)));
        existingVariant.setProduct(existing);

        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), true, null, List.of())
        );

        catalogService.updateProduct(1L, buildProductRequest(List.of(buildVariantRequest(10L, "UPDATED-SKU", 20))));

        assertThat(existing.getVariants()).hasSize(1);
        assertThat(existing.getVariants().get(0).getId()).isEqualTo(10L);
        assertThat(existing.getVariants().get(0).getSku()).isEqualTo("UPDATED-SKU");
        assertThat(existing.getVariants().get(0).getStockQuantity()).isEqualTo(20);
    }

    @Test
    void updateProduct_removesVariant_whenAbsentFromRequest() {
        Variant existingVariant = Variant.builder().id(10L).sku("TO-REMOVE").stockQuantity(2).active(true).build();
        Product existing = Product.builder().id(1L).name("Custom Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        existing.setVariants(new java.util.ArrayList<>(List.of(existingVariant)));
        existingVariant.setProduct(existing);

        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), true, null, List.of())
        );

        catalogService.updateProduct(1L, buildProductRequest(List.of()));

        assertThat(existing.getVariants()).isEmpty();
    }

    @Test
    void updateProduct_throwsNotFound_whenVariantIdDoesNotBelongToProduct() {
        Product existing = Product.builder().id(1L).name("Custom Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        existing.setVariants(new java.util.ArrayList<>());

        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));

        ProductRequest request = buildProductRequest(List.of(buildVariantRequest(999L, "GHOST-SKU", 1)));

        assertThatThrownBy(() -> catalogService.updateProduct(1L, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void deleteProduct_deletesExistingProduct() {
        Product existing = Product.builder().id(1L).name("Custom Tumbler").build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));

        catalogService.deleteProduct(1L);

        verify(productRepository).delete(existing);
    }

    @Test
    void deleteProduct_throwsNotFound_whenProductMissing() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> catalogService.deleteProduct(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }
}
