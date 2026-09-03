package com.adikabuyer.order.client;

import com.adikabuyer.order.dto.VariantPricing;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

/** Reads authoritative variant pricing straight from catalog-service (internal, no gateway). */
@Component
public class CatalogClient {

    private final RestClient restClient;

    public CatalogClient(RestClient catalogRestClient) {
        this.restClient = catalogRestClient;
    }

    public Map<Long, VariantPricing> fetchPricing(Collection<Long> variantIds) {
        if (variantIds.isEmpty()) {
            return Map.of();
        }
        String ids = variantIds.stream().map(String::valueOf).collect(Collectors.joining(","));

        VariantPricing[] result;
        try {
            result = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/catalog/variants/pricing")
                            .queryParam("ids", ids)
                            .build())
                    .retrieve()
                    .body(VariantPricing[].class);
        } catch (RestClientException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Catalog service is unavailable, please try again shortly");
        }

        if (result == null) {
            return Map.of();
        }
        return Arrays.stream(result).collect(Collectors.toMap(VariantPricing::variantId, pricing -> pricing));
    }
}
