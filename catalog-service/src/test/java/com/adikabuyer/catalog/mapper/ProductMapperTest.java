package com.adikabuyer.catalog.mapper;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.dto.ProductDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ProductMapperTest {

    private ProductMapper productMapper;

    @BeforeEach
    void setUp() {
        ProductMapperImpl impl = new ProductMapperImpl();
        ReflectionTestUtils.setField(impl, "variantMapper", new VariantMapperImpl());
        productMapper = impl;
    }

    @Test
    void toDto_mapsNestedVariantsWithJsonbAttributes() {
        Product product = Product.builder()
                .id(1L)
                .name("Tumbler")
                .description("Insulated steel tumbler")
                .category("Drinkware")
                .basePrice(BigDecimal.valueOf(25))
                .active(true)
                .imageUrl("http://localhost:9000/adikabuyer-media/photo.png")
                .build();
        Variant variant = Variant.builder()
                .id(10L)
                .product(product)
                .sku("TUM-BLK-500")
                .attributes(Map.of("color", "black"))
                .stockQuantity(3)
                .active(true)
                .build();
        product.setVariants(List.of(variant));

        ProductDto dto = productMapper.toDto(product);

        assertThat(dto.id()).isEqualTo(1L);
        assertThat(dto.name()).isEqualTo("Tumbler");
        assertThat(dto.variants()).hasSize(1);
        assertThat(dto.variants().get(0).sku()).isEqualTo("TUM-BLK-500");
        assertThat(dto.variants().get(0).attributes()).containsEntry("color", "black");
        assertThat(dto.imageUrl()).isEqualTo("http://localhost:9000/adikabuyer-media/photo.png");
    }

    @Test
    void toDto_handlesNullDescriptionAndEmptyVariants() {
        Product product = Product.builder()
                .id(2L)
                .name("No Frills Product")
                .description(null)
                .category(null)
                .basePrice(BigDecimal.ONE)
                .active(true)
                .build();

        ProductDto dto = productMapper.toDto(product);

        assertThat(dto.description()).isNull();
        assertThat(dto.category()).isNull();
        assertThat(dto.variants()).isEmpty();
    }
}
