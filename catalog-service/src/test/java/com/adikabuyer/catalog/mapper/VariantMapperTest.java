package com.adikabuyer.catalog.mapper;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.dto.VariantDto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class VariantMapperTest {

    private final VariantMapper variantMapper = new VariantMapperImpl();

    @Test
    void toDto_mapsProductIdFromNestedProduct() {
        Product product = Product.builder().id(42L).build();
        Variant variant = Variant.builder()
                .id(1L)
                .product(product)
                .sku("SKU-1")
                .attributes(Map.of("color", "black", "size", "500ml"))
                .priceOverride(BigDecimal.valueOf(19.99))
                .stockQuantity(5)
                .active(true)
                .build();

        VariantDto dto = variantMapper.toDto(variant);

        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.productId()).isEqualTo(42L);
        assertThat(dto.sku()).isEqualTo("SKU-1");
        assertThat(dto.attributes()).containsEntry("color", "black").containsEntry("size", "500ml");
        assertThat(dto.priceOverride()).isEqualByComparingTo("19.99");
        assertThat(dto.stockQuantity()).isEqualTo(5);
        assertThat(dto.active()).isTrue();
    }

    @Test
    void toDto_returnsNullProductId_whenVariantHasNoProduct() {
        Variant variant = Variant.builder()
                .id(1L)
                .sku("SKU-1")
                .attributes(Map.of())
                .stockQuantity(0)
                .active(false)
                .build();

        VariantDto dto = variantMapper.toDto(variant);

        assertThat(dto.productId()).isNull();
    }

    @Test
    void toDto_returnsNull_whenVariantIsNull() {
        assertThat(variantMapper.toDto(null)).isNull();
    }
}
