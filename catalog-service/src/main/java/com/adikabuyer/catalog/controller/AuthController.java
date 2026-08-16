package com.adikabuyer.catalog.controller;

import com.adikabuyer.catalog.dto.LoginRequest;
import com.adikabuyer.catalog.dto.LoginResponse;
import com.adikabuyer.catalog.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String adminPasswordHash;

    public AuthController(
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            @Value("${app.security.admin-username}") String adminUsername,
            @Value("${app.security.admin-password-hash}") String adminPasswordHash
    ) {
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.adminPasswordHash = adminPasswordHash;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        boolean usernameMatches = adminUsername.equals(request.username());
        boolean passwordMatches = passwordEncoder.matches(request.password(), adminPasswordHash);

        if (!usernameMatches || !passwordMatches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtUtil.generateToken(adminUsername, "ADMIN");
        return ResponseEntity.ok(new LoginResponse(token, "Bearer"));
    }
}
