package com.adikabuyer.catalog.controller;

import com.adikabuyer.catalog.dto.LoginRequest;
import com.adikabuyer.catalog.dto.LoginResponse;
import com.adikabuyer.catalog.security.JwtUtil;
import com.adikabuyer.catalog.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final LoginRateLimiter loginRateLimiter;
    private final String adminUsername;
    private final String adminPasswordHash;

    public AuthController(
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            LoginRateLimiter loginRateLimiter,
            @Value("${app.security.admin-username}") String adminUsername,
            @Value("${app.security.admin-password-hash}") String adminPasswordHash
    ) {
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.loginRateLimiter = loginRateLimiter;
        this.adminUsername = adminUsername;
        this.adminPasswordHash = adminPasswordHash;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        // Caddy stamps X-Real-Ip with the real TCP peer and the gateway passes it
        // through untouched, so a client can't rotate it to dodge the per-IP limit.
        // Fall back to the connection address when the request didn't come via Caddy.
        String clientKey = clientIp(httpRequest);
        if (!loginRateLimiter.isAllowed(clientKey)) {
            log.warn("Login rate limit exceeded for client {}", clientKey);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts. Please try again later.");
        }

        boolean usernameMatches = adminUsername.equals(request.username());
        boolean passwordMatches = passwordEncoder.matches(request.password(), adminPasswordHash);

        if (!usernameMatches || !passwordMatches) {
            log.warn("Failed login for username '{}' from client {}", forLog(request.username()), clientKey);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        log.info("Successful admin login from client {}", clientKey);
        String token = jwtUtil.generateToken(adminUsername, "ADMIN");
        return ResponseEntity.ok(new LoginResponse(token, "Bearer"));
    }

    private static String clientIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-Ip");
        return realIp != null && !realIp.isBlank() ? realIp.trim() : request.getRemoteAddr();
    }

    /** Strips CR/LF and other control characters so a crafted username can't forge log lines. */
    private static String forLog(String value) {
        if (value == null) {
            return "";
        }
        String cleaned = value.replaceAll("[\\p{Cntrl}]", "_");
        return cleaned.length() > 100 ? cleaned.substring(0, 100) + "..." : cleaned;
    }
}
