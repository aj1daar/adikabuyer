# Security notes

Running record of the security posture: what was reviewed (OWASP Top 10, Aug 2026),
what got fixed, and what is a known limitation with the reasoning for leaving it.

## Fixed

| Area | Change |
|---|---|
| Prod infra exposure | `docker-compose.prod.yml` no longer publishes Postgres or the RabbitMQ broker port to the host; RabbitMQ UI and MinIO are bound to `127.0.0.1` only. Only Caddy (80/443) is public. |
| Committed secrets | JWT secret and admin bcrypt hash removed from `application.yml` — now env-only (`APP_JWT_SECRET`, `APP_SECURITY_ADMIN_PASSWORD_HASH`), with visibly-fake dev fallbacks. `application-prod.yml` makes them hard `:?` requirements; both services run `SPRING_PROFILES_ACTIVE=prod`. |
| Login rate-limit bypass | Caddy overwrites `X-Forwarded-For` with the real TCP peer and strips inbound `Forwarded`/`X-Forwarded-Host`, so the per-IP key can't be rotated. Added a global 20/min backstop across all clients in `LoginRateLimiter`. |
| Media upload (stored XSS) | `S3StorageService` validates the file's magic bytes (JPEG/PNG/GIF/WebP) and rejects anything else — an `image/svg+xml` or HTML payload can no longer be stored. Stored content type is derived from the bytes, never the client header. `MediaController` allowlists declared types. Caddy serves `/media/*` with `Content-Disposition: attachment` + `nosniff`. |
| Response headers | Caddy sends CSP (`script-src 'self'`, `frame-ancestors 'none'`, …), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, explicit HSTS with `includeSubDomains`; drops `Server`. |
| Auth logging | Failed logins (with sanitised username + client IP), successful logins, and rate-limit rejections are logged. `LoginRequest` now bounds field sizes (username ≤ 100, password ≤ 72 — bcrypt's limit). |
| Mutation audit log | `AuditLoggingFilter` (both services, inside the security chain) logs one line per POST/PUT/PATCH/DELETE to `/api/**` — `method path by <principal> -> <status>` — so allowed *and* denied (401/403) admin actions leave a trail on the `audit` logger. |
| Dependency visibility | `.github/dependabot.yml` (maven/npm/docker/actions, weekly) + a Trivy `fs` scan and `npm audit --audit-level=high` in CI. |
| Framework upgrade | Spring Boot 3.3.4 → **4.1.1**, Spring Cloud 2023.0.3 → **2025.1.3** (both were past OSS support). jjwt 0.13.0, AWS SDK 2.54.10, MapStruct 1.6.3, JaCoCo 0.8.15. Jackson 3, Jakarta EE 11, Spring Security 7, Hibernate 7, Tomcat 11. Smoke-tested: full `docker-compose.prod.yml` stack boots healthy, catalog/auth/rate-limit verified end-to-end through Caddy. |
| Checkout re-pricing | `OrderService.checkout` re-resolves every cart line against catalog-service (`GET /api/catalog/variants/pricing`) and uses the catalog's price / name / SKU, never the client's. Unknown, inactive or `SOLD_OUT` variants are rejected (400/409), and stock is checked (`PRE_ORDER` excepted). |
| Supply chain | MinIO pinned to a release digest, `appleboy/ssh-action` to a commit SHA; deploy force-recreates the gateway so it can't hold a stale IP for a rebuilt catalog/order container. |

## Deployer checklist (one-time, on the server)

- [ ] Rotate `APP_JWT_SECRET` (`openssl rand -hex 48`) and `APP_SECURITY_ADMIN_PASSWORD_HASH`
      (`htpasswd -bnBC 12 "" 'STRONG_PW' | tr -d ':\n' | sed 's/^\$2y/\$2a/'`, then `$`→`$$`).
      The old committed values (`3f8a1c9d…`, and a hash of `admin123`) must be treated as public.
- [ ] Rotate `POSTGRES_PASSWORD`, `RABBITMQ_PASSWORD`, `MINIO_ROOT_PASSWORD` off the `changeme*` examples.
- [ ] Update `.env.prod` on the box **and** the `ENV_PROD_B64` GitHub secret.
- [ ] Add a host firewall / cloud security group allowing only 22/80/443 inbound
      (Docker's port publishing bypasses `ufw` — needs a `DOCKER-USER` rule or a provider firewall).
- [ ] Verify from an external host: `nmap -Pn -p 5433,5672,9000,9001,15672 adikabuyer.kg` → all filtered.

## Known limitations (accepted, with reasoning)

- **Spring Boot 4 migration notes.** Done and smoke-tested end-to-end (fresh `docker-compose.prod.yml`
  volumes: Flyway, product CRUD, media upload, checkout, RabbitMQ inventory deduction all verified).
  Gotchas that bit: `@MockBean` → `@MockitoBean`; `@WebMvcTest` needs `spring-boot-starter-webmvc-test`;
  Flyway autoconfig needs `spring-boot-starter-flyway` (raw `flyway-core` no longer triggers it — it
  silently doesn't run); security auto-config moved to `org.springframework.boot.security.autoconfigure.*`;
  Jackson 3 is `tools.jackson.*`; Spring AMQP still ships a Jackson 2 converter that can't serialize
  `Instant` — use `new JacksonJsonMessageConverter()`; the gateway's `spring.cloud.gateway.{routes,globalcors}`
  moved under `.server.webflux.*`; `RestClient.Builder` isn't auto-configured for a plain MVC app.
  `docs/ARCHITECTURE.md` has the full list.
- **Checkout stock check is best-effort.** `OrderService.checkout` re-prices and checks stock against
  catalog-service before creating the order, but the actual decrement happens asynchronously in
  `InventoryListener`. Two simultaneous checkouts for the last unit can both pass the pre-flight; the
  listener floors stock at 0 so nothing goes negative, but the operator may see one order they can't
  fulfil. Acceptable for a manually-fulfilled shop.
- **JWT stored in `localStorage`.** XSS-exfiltratable, but the token lives ≤ 1h and there is no
  raw-HTML sink in the frontend. Conscious trade-off vs. an httpOnly cookie + CSRF machinery for a
  single-admin app.
- **Non-revocable JWT, no refresh token, no MFA.** Single-admin simplicity; 1h expiry caps exposure.
- **In-memory rate limiter.** Fine for one instance; needs shared state (Redis) or a gateway/Caddy
  limiter before scaling out.
- **`postgres`, `rabbitmq`, `caddy`** base images are pinned to a major/minor tag, not a digest
  (MinIO is digest-pinned; `appleboy/ssh-action` is SHA-pinned). Dependabot's docker ecosystem
  watches them.
- **No log aggregation / alerting.** Logs go to stdout → Docker; no retention policy or off-box shipping.
- **No data-at-rest encryption** for Postgres/MinIO volumes.

## Not applicable

- **SSRF** — no code path turns user input into a server-side request target. The only outbound
  client (`TelegramApiClient`) has a hardcoded `api.telegram.org` base URL.
