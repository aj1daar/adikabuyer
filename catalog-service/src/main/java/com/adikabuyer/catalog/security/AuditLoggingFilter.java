package com.adikabuyer.catalog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * One line per state-changing API call: method, path, who, resulting status. Sits inside
 * the security chain (before exception translation) so both allowed and denied (403/401)
 * mutations are recorded.
 */
public class AuditLoggingFilter extends OncePerRequestFilter {

    private static final Logger AUDIT = LoggerFactory.getLogger("audit");
    private static final Set<String> MUTATING = Set.of("POST", "PUT", "PATCH", "DELETE");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } finally {
            if (MUTATING.contains(request.getMethod()) && request.getRequestURI().startsWith("/api/")) {
                AUDIT.info("{} {} by {} -> {}",
                        request.getMethod(), request.getRequestURI(), currentPrincipal(), response.getStatus());
            }
        }
    }

    private static String currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return "anonymous";
        }
        return authentication.getName();
    }
}
