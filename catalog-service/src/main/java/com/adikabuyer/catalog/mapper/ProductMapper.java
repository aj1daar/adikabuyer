package com.adikabuyer.catalog.mapper;

import com.adikabuyer.catalog.domain.Product;
import com.adikabuyer.catalog.dto.ProductDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = VariantMapper.class)
public interface ProductMapper {

    ProductDto toDto(Product product);
}
