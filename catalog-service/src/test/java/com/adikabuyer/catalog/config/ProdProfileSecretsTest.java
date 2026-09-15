package com.adikabuyer.catalog.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySourcesPropertyResolver;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The prod profile must refuse to start without real secrets. Spring has no shell-style
 * {@code ${X:?msg}} — that syntax quietly resolves to the literal "?msg", which would make a
 * public string the JWT signing key — so these properties must carry no fallback at all.
 */
class ProdProfileSecretsTest {

    private PropertySourcesPropertyResolver prodResolver(Map<String, Object> env) throws IOException {
        MutablePropertySources sources = new MutablePropertySources();
        sources.addFirst(new MapPropertySource(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, env));
        new YamlPropertySourceLoader().load("prod", new ClassPathResource("application-prod.yml")).forEach(sources::addLast);
        return new PropertySourcesPropertyResolver(sources);
    }

    @Test
    void jwtSecret_failsToResolve_whenTheEnvironmentVariableIsMissing() throws IOException {
        PropertySourcesPropertyResolver resolver = prodResolver(Map.of());

        assertThatThrownBy(() -> resolver.getProperty("app.jwt.secret"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("APP_JWT_SECRET");
    }

    @Test
    void adminPasswordHash_failsToResolve_whenTheEnvironmentVariableIsMissing() throws IOException {
        PropertySourcesPropertyResolver resolver = prodResolver(Map.of());

        assertThatThrownBy(() -> resolver.getProperty("app.security.admin-password-hash"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("APP_SECURITY_ADMIN_PASSWORD_HASH");
    }

    @Test
    void jwtSecret_comesStraightFromTheEnvironment_whenSet() throws IOException {
        PropertySourcesPropertyResolver resolver = prodResolver(Map.of("APP_JWT_SECRET", "real-secret-from-the-deploy-env-0123456789"));

        assertThat(resolver.getProperty("app.jwt.secret")).isEqualTo("real-secret-from-the-deploy-env-0123456789");
    }
}
