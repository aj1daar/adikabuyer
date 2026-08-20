package com.adikabuyer.catalog.dto;

import com.adikabuyer.catalog.domain.VariantStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class VariantRequestTest {

    @Test
    void statusOrDefault_returnsGivenStatus_whenPresent() {
        VariantRequest request = new VariantRequest(
                null, "SKU-1", Map.of(), BigDecimal.TEN, 1, true, List.of(), VariantStatus.PRE_ORDER
        );

        assertThat(request.statusOrDefault()).isEqualTo(VariantStatus.PRE_ORDER);
    }

    @Test
    void statusOrDefault_returnsInStock_whenStatusIsNull() {
        VariantRequest request = new VariantRequest(
                null, "SKU-1", Map.of(), BigDecimal.TEN, 1, true, List.of(), null
        );

        assertThat(request.statusOrDefault()).isEqualTo(VariantStatus.IN_STOCK);
    }
}
