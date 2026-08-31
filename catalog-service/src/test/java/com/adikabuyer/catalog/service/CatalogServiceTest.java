package com.adikabuyer.catalog.service;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.domain.VariantStatus;
import com.adikabuyer.catalog.dto.ProductDto;
import com.adikabuyer.catalog.dto.ProductPageResponse;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
        ProductDto dto = new ProductDto(1L, "Tumbler", null, null, BigDecimal.TEN, null, true, null, null, null, false, List.of());

        when(productRepository.search(null, null, null, null, null, null, false, PageRequest.of(0, 12)))
                .thenReturn(new PageImpl<>(List.of(product)));
        when(productMapper.toDto(product)).thenReturn(dto);

        ProductPageResponse result = catalogService.getAllProducts(null, null, null, null, null, null, 0, 12, false);

        assertThat(result.items()).containsExactly(dto);
        assertThat(result.totalCount()).isEqualTo(1);
        assertThat(result.page()).isEqualTo(0);
        assertThat(result.pageSize()).isEqualTo(12);
    }

    @Test
    void getAllProducts_returnsEmptyList_whenRepositoryIsEmpty() {
        when(productRepository.search(null, null, null, null, null, null, false, PageRequest.of(0, 12)))
                .thenReturn(new PageImpl<>(List.of()));

        assertThat(catalogService.getAllProducts(null, null, null, null, null, null, 0, 12, false).items()).isEmpty();
    }

    @Test
    void getAllProducts_normalizesBlankFilters_toNull() {
        when(productRepository.search(null, null, null, null, null, null, false, PageRequest.of(0, 12)))
                .thenReturn(new PageImpl<>(List.of()));

        catalogService.getAllProducts("  ", "", null, "   ", null, null, 0, 12, false);

        verify(productRepository).search(null, null, null, null, null, null, false, PageRequest.of(0, 12));
    }

    @Test
    void getAllProducts_trimsAndForwardsNonBlankFilters() {
        BigDecimal volumeMin = BigDecimal.valueOf(300);
        BigDecimal volumeMax = BigDecimal.valueOf(600);
        when(productRepository.search("tumbler", "Drinkware", "black", "M", volumeMin, volumeMax, false, PageRequest.of(0, 12)))
                .thenReturn(new PageImpl<>(List.of()));

        catalogService.getAllProducts(" tumbler ", " Drinkware ", " black ", " M ", volumeMin, volumeMax, 0, 12, false);

        verify(productRepository).search("tumbler", "Drinkware", "black", "M", volumeMin, volumeMax, false, PageRequest.of(0, 12));
    }

    @Test
    void getCategories_returnsDistinctCategoriesFromRepository() {
        when(productRepository.findDistinctCategories(null, null, null, null, null))
                .thenReturn(List.of("Drinkware", "Одежда"));

        assertThat(catalogService.getCategories(null, null, null, null, null)).containsExactly("Drinkware", "Одежда");
    }

    @Test
    void getCategories_normalizesBlankFilters_toNull() {
        when(productRepository.findDistinctCategories(null, null, null, null, null)).thenReturn(List.of());

        catalogService.getCategories("  ", "", "   ", null, null);

        verify(productRepository).findDistinctCategories(null, null, null, null, null);
    }

    @Test
    void getCategories_trimsAndForwardsNonBlankFilters() {
        BigDecimal volumeMin = BigDecimal.valueOf(300);
        BigDecimal volumeMax = BigDecimal.valueOf(600);
        when(productRepository.findDistinctCategories("tumbler", "black", "M", volumeMin, volumeMax))
                .thenReturn(List.of());

        catalogService.getCategories(" tumbler ", " black ", " M ", volumeMin, volumeMax);

        verify(productRepository).findDistinctCategories("tumbler", "black", "M", volumeMin, volumeMax);
    }

    @Test
    void getProductById_returnsDto_whenProductExists() {
        Product product = Product.builder().id(1L).name("Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        ProductDto dto = new ProductDto(1L, "Tumbler", null, null, BigDecimal.TEN, null, true, null, null, null, false, List.of());

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productMapper.toDto(product)).thenReturn(dto);

        assertThat(catalogService.getProductById(1L)).isEqualTo(dto);
    }

    @Test
    void getProductById_throwsNotFound_whenEveryVariantIsSoldOut() {
        Product product = Product.builder().id(1L).name("Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        product.setVariants(new java.util.ArrayList<>(List.of(
                Variant.builder().id(10L).sku("A").status(VariantStatus.SOLD_OUT).stockQuantity(0).active(true).build(),
                Variant.builder().id(11L).sku("B").status(VariantStatus.SOLD_OUT).stockQuantity(0).active(true).build()
        )));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> catalogService.getProductById(1L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void getProductById_returnsDto_whenAtLeastOneVariantIsNotSoldOut() {
        Product product = Product.builder().id(1L).name("Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        product.setVariants(new java.util.ArrayList<>(List.of(
                Variant.builder().id(10L).sku("A").status(VariantStatus.SOLD_OUT).stockQuantity(0).active(true).build(),
                Variant.builder().id(11L).sku("B").status(VariantStatus.IN_STOCK).stockQuantity(4).active(true).build()
        )));
        ProductDto dto = new ProductDto(1L, "Tumbler", null, null, BigDecimal.TEN, null, true, null, null, null, false, List.of());
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
        return new VariantRequest(id, sku, Map.of("color", "black"), BigDecimal.TEN, stock, true, List.of(), VariantStatus.IN_STOCK);
    }

    private ProductRequest buildProductRequest(List<VariantRequest> variants) {
        return new ProductRequest("Custom Tumbler", "desc", "Drinkware", true, null, null, variants);
    }

    @Test
    void createProduct_savesProductWithLinkedVariants_andReturnsMappedDto() {
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ProductDto dto = new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), null, true, null, null, null, false, List.of());
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
        assertThat(saved.getBasePrice()).isEqualByComparingTo("10");
        assertThat(saved.getImageUrl()).isNull();
        assertThat(result).isEqualTo(dto);
    }

    @Test
    void createProduct_keepsColorSwatchesForKnownColours_andDropsUnknownOnes() {
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), null, true, null, null, null, false, List.of())
        );

        VariantRequest black = new VariantRequest(null, null, Map.of("color", "Чёрный"), BigDecimal.TEN, 1, true,
                List.of(), VariantStatus.IN_STOCK);
        Map<String, String> swatches = new java.util.HashMap<>();
        swatches.put("Чёрный", "http://cdn/black-swatch.png");
        swatches.put("Розовый", "http://cdn/pink-swatch.png");
        ProductRequest request = new ProductRequest("Custom Tumbler", "desc", "Drinkware", true, swatches, null, List.of(black));

        catalogService.createProduct(request);

        ArgumentCaptor<Product> savedCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getColorSwatches())
                .containsEntry("Чёрный", "http://cdn/black-swatch.png")
                .doesNotContainKey("Розовый");
    }

    @Test
    void createProduct_trimsDedupesAndDropsBlankLabels() {
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), null, true, null, null, null, false, List.of())
        );

        VariantRequest v = buildVariantRequest(null, "SKU-L", 1);
        ProductRequest request = new ProductRequest("Custom Tumbler", "desc", "Drinkware", true, null,
                java.util.Arrays.asList("  Limited  ", "", "С принтом", "Limited", null), List.of(v));

        catalogService.createProduct(request);

        ArgumentCaptor<Product> savedCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getLabels()).containsExactly("Limited", "С принтом");
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
    void createProduct_derivesBasePriceAndImageFromCheapestAndFirstImagedVariant() {
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), null, true, null, null, null, false, List.of())
        );

        VariantRequest cheap = new VariantRequest(null, "SKU-CHEAP", Map.of(), BigDecimal.valueOf(15), 1, true,
                List.of("http://cdn/cheap.png"), VariantStatus.IN_STOCK);
        VariantRequest pricey = new VariantRequest(null, "SKU-PRICEY", Map.of(), BigDecimal.valueOf(30), 1, true,
                List.of("http://cdn/pricey.png"), VariantStatus.IN_STOCK);

        catalogService.createProduct(buildProductRequest(List.of(pricey, cheap)));

        ArgumentCaptor<Product> savedCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(savedCaptor.capture());

        Product saved = savedCaptor.getValue();
        assertThat(saved.getBasePrice()).isEqualByComparingTo("15");
        assertThat(saved.getImageUrl()).isEqualTo("http://cdn/pricey.png");
    }

    @Test
    void createProduct_throwsBadRequest_whenVariantListIsEmpty() {
        ProductRequest request = buildProductRequest(List.of());

        assertThatThrownBy(() -> catalogService.createProduct(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");

        verifyNoInteractions(productRepository);
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
        existing.setVariants(new java.util.ArrayList<>());
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), null, true, null, null, null, false, List.of())
        );

        catalogService.updateProduct(1L, buildProductRequest(List.of(buildVariantRequest(null, "TUM-BLK-500", 10))));

        assertThat(existing.getName()).isEqualTo("Custom Tumbler");
        assertThat(existing.getBasePrice()).isEqualByComparingTo("10");
        assertThat(existing.isActive()).isTrue();
        assertThat(existing.getImageUrl()).isNull();
    }

    @Test
    void updateProduct_throwsBadRequest_whenVariantListIsEmpty() {
        Product existing = Product.builder().id(1L).name("Custom Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        existing.setVariants(new java.util.ArrayList<>());
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> catalogService.updateProduct(1L, buildProductRequest(List.of())))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void updateProduct_addsNewVariant_whenRequestVariantHasNoId() {
        Product existing = Product.builder().id(1L).name("Custom Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), null, true, null, null, null, false, List.of())
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
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), null, true, null, null, null, false, List.of())
        );

        catalogService.updateProduct(1L, buildProductRequest(List.of(buildVariantRequest(10L, "UPDATED-SKU", 20))));

        assertThat(existing.getVariants()).hasSize(1);
        assertThat(existing.getVariants().get(0).getId()).isEqualTo(10L);
        assertThat(existing.getVariants().get(0).getSku()).isEqualTo("UPDATED-SKU");
        assertThat(existing.getVariants().get(0).getStockQuantity()).isEqualTo(20);
    }

    @Test
    void updateProduct_removesVariant_whenAbsentFromRequest() {
        Variant keepVariant = Variant.builder().id(10L).sku("KEEP").stockQuantity(2).active(true).build();
        Variant removeVariant = Variant.builder().id(11L).sku("TO-REMOVE").stockQuantity(2).active(true).build();
        Product existing = Product.builder().id(1L).name("Custom Tumbler").basePrice(BigDecimal.TEN).active(true).build();
        existing.setVariants(new java.util.ArrayList<>(List.of(keepVariant, removeVariant)));
        keepVariant.setProduct(existing);
        removeVariant.setProduct(existing);

        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productMapper.toDto(any(Product.class))).thenReturn(
                new ProductDto(1L, "Custom Tumbler", "desc", "Drinkware", BigDecimal.valueOf(25), null, true, null, null, null, false, List.of())
        );

        catalogService.updateProduct(1L, buildProductRequest(List.of(buildVariantRequest(10L, "KEEP", 2))));

        assertThat(existing.getVariants()).hasSize(1);
        assertThat(existing.getVariants().get(0).getId()).isEqualTo(10L);
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
