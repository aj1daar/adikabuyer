package com.adikabuyer.catalog.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private final JwtUtil jwtUtil = new JwtUtil("test-secret-key-that-is-at-least-32-bytes-long", 3600000L);

    @Test
    void generateToken_producesTokenThatIsValid() {
        String token = jwtUtil.generateToken("admin", "ADMIN");

        assertThat(jwtUtil.isValid(token)).isTrue();
    }

    @Test
    void parseClaims_returnsSubjectAndRole_fromGeneratedToken() {
        String token = jwtUtil.generateToken("admin", "ADMIN");

        Claims claims = jwtUtil.parseClaims(token);

        assertThat(claims.getSubject()).isEqualTo("admin");
        assertThat(claims.get("role", String.class)).isEqualTo("ADMIN");
    }

    @Test
    void isValid_returnsFalse_forTamperedToken() {
        String token = jwtUtil.generateToken("admin", "ADMIN");
        // change the signature's first char: the last base64url char carries padding bits,
        // so overwriting the tail could decode to the very same signature
        int signature = token.lastIndexOf('.') + 1;
        String tamperedToken = token.substring(0, signature)
                + (token.charAt(signature) == 'A' ? 'B' : 'A')
                + token.substring(signature + 1);

        assertThat(jwtUtil.isValid(tamperedToken)).isFalse();
    }

    @Test
    void isValid_returnsFalse_forExpiredToken() {
        JwtUtil expiredTokenIssuer = new JwtUtil("test-secret-key-that-is-at-least-32-bytes-long", -1000L);

        String expiredToken = expiredTokenIssuer.generateToken("admin", "ADMIN");

        assertThat(jwtUtil.isValid(expiredToken)).isFalse();
    }

    @Test
    void isValid_returnsFalse_forTokenSignedWithDifferentSecret() {
        JwtUtil otherIssuer = new JwtUtil("a-completely-different-secret-key-value-1234567890", 3600000L);

        String token = otherIssuer.generateToken("admin", "ADMIN");

        assertThat(jwtUtil.isValid(token)).isFalse();
    }

    @Test
    void isValid_returnsFalse_forGarbageInput() {
        assertThat(jwtUtil.isValid("not-a-jwt-at-all")).isFalse();
    }
}
