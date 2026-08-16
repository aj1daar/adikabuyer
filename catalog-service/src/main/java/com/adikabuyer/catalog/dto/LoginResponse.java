package com.adikabuyer.catalog.dto;

public record LoginResponse(
        String token,
        String tokenType
) {
}
