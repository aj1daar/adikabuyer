package com.adikabuyer.order.client;

import com.adikabuyer.order.dto.VariantPricing;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CatalogClientTest {

    private MockRestServiceServer server;
    private CatalogClient catalogClient;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://catalog:8081");
        server = MockRestServiceServer.bindTo(builder).build();
        catalogClient = new CatalogClient(builder.build());
    }

    @Test
    void fetchPricing_requestsCommaJoinedIds_andParsesResponse() {
        server.expect(requestTo("http://catalog:8081/api/catalog/variants/pricing?ids=1,2"))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andRespond(withSuccess("""
                        [
                          {"variantId":1,"productName":"Mug","sku":"MUG-1","unitPrice":1200,"stockQuantity":3,"active":true,"status":"IN_STOCK"},
                          {"variantId":2,"productName":"Cap","sku":"CAP-1","unitPrice":800,"stockQuantity":0,"active":true,"status":"PRE_ORDER"}
                        ]
                        """, APPLICATION_JSON));

        Map<Long, VariantPricing> result = catalogClient.fetchPricing(List.of(1L, 2L));

        assertThat(result).hasSize(2);
        assertThat(result.get(1L).unitPrice()).isEqualByComparingTo(BigDecimal.valueOf(1200));
        assertThat(result.get(1L).productName()).isEqualTo("Mug");
        assertThat(result.get(2L).status()).isEqualTo("PRE_ORDER");
        server.verify();
    }

    @Test
    void fetchPricing_emptyIds_returnsEmptyMap_withoutCallingCatalog() {
        assertThat(catalogClient.fetchPricing(List.of())).isEmpty();
        server.verify(); // no expectations set, so no request was made
    }

    @Test
    void fetchPricing_wrapsUpstreamErrorAsBadGateway() {
        server.expect(requestTo("http://catalog:8081/api/catalog/variants/pricing?ids=1"))
                .andRespond(withServerError());

        assertThatThrownBy(() -> catalogClient.fetchPricing(List.of(1L)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("502");
    }
}
