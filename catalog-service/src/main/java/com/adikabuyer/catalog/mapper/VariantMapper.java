package com.adikabuyer.catalog.mapper;

import com.adikabuyer.catalog.domain.Variant;
import com.adikabuyer.catalog.dto.VariantDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface VariantMapper {

    @Mapping(source = "product.id", target = "productId")
    VariantDto toDto(Variant variant);
}
