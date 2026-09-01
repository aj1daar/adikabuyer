package com.adikabuyer.catalog.dto;

import com.adikabuyer.catalog.domain.VariantStatus;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class VariantRequestTest {

    @Test
    void attributes_rejectMoreThanFiveEntries() {
        Map<String, Object> tooMany = Map.of("a", "1", "b", "2", "c", "3", "d", "4", "e", "5", "f", "6");
        VariantRequest request = new VariantRequest(
                null, "SKU-1", tooMany, BigDecimal.TEN, 1, true, List.of(), VariantStatus.IN_STOCK
        );

        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            assertThat(validator.validate(request))
                    .anyMatch(violation -> violation.getPropertyPath().toString().equals("attributes"));
        }
    }

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
