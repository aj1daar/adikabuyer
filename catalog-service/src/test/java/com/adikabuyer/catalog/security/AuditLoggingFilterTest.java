package com.adikabuyer.catalog.security;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AuditLoggingFilterTest {

    private final AuditLoggingFilter filter = new AuditLoggingFilter();
    private final Logger auditLogger = (Logger) LoggerFactory.getLogger("audit");
    private final ListAppender<ILoggingEvent> appender = new ListAppender<>();

    @BeforeEach
    void attachAppender() {
        appender.start();
        auditLogger.addAppender(appender);
    }

    @AfterEach
    void detach() {
        auditLogger.detachAppender(appender);
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletResponse run(String method, String uri, int status) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> ((MockHttpServletResponse) res).setStatus(status);
        filter.doFilter(request, response, chain);
        return response;
    }

    @Test
    void logsMutatingApiRequest_withMethodPathPrincipalAndStatus() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "admin", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));

        run("POST", "/api/catalog/products", 201);

        assertThat(appender.list).singleElement().satisfies(event -> {
            assertThat(event.getLevel()).isEqualTo(Level.INFO);
            assertThat(event.getFormattedMessage()).isEqualTo("POST /api/catalog/products by admin -> 201");
        });
    }

    @Test
    void logsDeniedMutation_asAnonymous() throws Exception {
        run("DELETE", "/api/catalog/products/5", 403);

        assertThat(appender.list).singleElement().satisfies(event ->
                assertThat(event.getFormattedMessage()).isEqualTo("DELETE /api/catalog/products/5 by anonymous -> 403"));
    }

    @Test
    void doesNotLog_readRequests() throws Exception {
        run("GET", "/api/catalog/products", 200);

        assertThat(appender.list).isEmpty();
    }

    @Test
    void doesNotLog_nonApiPaths() throws Exception {
        run("POST", "/actuator/refresh", 200);

        assertThat(appender.list).isEmpty();
    }
}
