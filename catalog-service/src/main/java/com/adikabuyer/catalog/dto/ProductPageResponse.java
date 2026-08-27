package com.adikabuyer.catalog.dto;

import java.util.List;

public record ProductPageResponse(
        List<ProductDto> items,
        long totalCount,
        int page,
        int pageSize
) {
}
