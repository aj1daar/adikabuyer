package com.adikabuyer.catalog.mapper;

import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.dto.VariantDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface VariantMapper {

    @Mapping(source = "product.id", target = "productId")
    @Mapping(
            target = "displayPrice",
            expression = "java(com.adikabuyer.catalog.util.PriceCalculator.computeVariantDisplayPrice(variant.getPriceOverride(), variant.getProduct()))"
    )
    VariantDto toDto(Variant variant);
}
