package com.adikabuyer.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Boots the full gateway context so a broken route/CORS config or an incompatible
 * Spring Cloud version fails here rather than on the server.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiGatewayApplicationTest {

    @Test
    void contextLoads() {
    }
}
