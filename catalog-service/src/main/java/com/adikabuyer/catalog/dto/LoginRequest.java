package com.adikabuyer.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(max = 100) String username,
        // bcrypt only hashes the first 72 bytes; cap here so an over-long password is a
        // clear 400 rather than silently ignored input.
        @NotBlank @Size(max = 72) String password
) {
}
