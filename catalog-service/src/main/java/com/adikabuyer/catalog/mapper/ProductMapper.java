package com.adikabuyer.catalog.mapper;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.dto.ProductDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = VariantMapper.class)
public interface ProductMapper {

    @Mapping(
            target = "displayPrice",
            expression = "java(com.adikabuyer.catalog.util.PriceCalculator.computeDisplayPrice(product.getBasePrice()))"
    )
    ProductDto toDto(Product product);
}
