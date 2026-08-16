# Architecture

## Services

| Service | Port | Notes |
|---|---|---|
| `frontend` | 5173 | Vite dev server, talks only to the gateway |
| `api-gateway` | 8080 | Spring Cloud Gateway, routes `/api/catalog/**` and `/api/orders/**`, handles CORS |
| `catalog-service` | 8081 | Products, variants, inventory, media upload, auth |
| `order-service` | 8082 | Checkout, WhatsApp link generation, publishes order events |
| `postgres-db` | 5433 (host) | Catalog data, Flyway-migrated |
| `rabbitmq` | 5672 / 15672 | Order-placed event bus |
| `minio` | 9000 / 9001 | Local S3 stand-in for product media |

In dev, `postgres-db`, `rabbitmq`, and `api-gateway` run in Docker; `catalog-service`, `order-service`, and the frontend run on the host, reached via `host.docker.internal`. `docker-compose.prod.yml` containerizes everything instead.

## Order flow

`order-service` builds a WhatsApp deep link from the cart and publishes an `OrderPlacedEvent` to the `order.exchange`/`order.queue` topology. `catalog-service` consumes that same queue and decrements `variant.stock_quantity`; a variant flips from `IN_STOCK` to `PRE_ORDER` at zero stock. Nothing persists the order itself — if the queue message is lost, so is the order record. The customer still has the WhatsApp thread as the source of truth.

## Auth

`catalog-service` write endpoints (`POST`/`PUT`/`DELETE` under `/api/catalog/**`) require a JWT with `ROLE_ADMIN`, issued by `POST /api/auth/login`. GETs stay public. One hardcoded admin user, bcrypt hash in `application.yml` for local dev, overridden by `APP_SECURITY_ADMIN_PASSWORD_HASH` in prod. Login is rate-limited to 5 attempts/min/IP, in-memory, resets on restart — fine for one instance, won't hold once there's more than one.

401 vs 403: 401 is no/invalid token, 403 is a valid token with the wrong role. Both come back through a custom `AuthenticationEntryPoint`/`AccessDeniedHandler` so they get the same JSON error shape as everything else instead of Spring Security's default empty body.

## Media upload

`POST /api/media/upload` (admin-only) pushes the file to S3-compatible storage and returns a public URL, stored on `product.image_url`. Locally that's MinIO; point the `S3_*` env vars at Cloudflare R2 and it's the same code path. Bucket is created with a public-read policy on `catalog-service` startup if it doesn't exist. No resizing, no format conversion — whatever gets uploaded is what gets served.

## Catalog search/filter

`GET /api/catalog/products` takes `search`, `color`, `size`, `volume` query params. `search` is an `ILIKE` on product name; the attribute filters are native Postgres queries against the `variant.attributes` JSONB column (`attributes ->> 'color'`, etc.), case-insensitive, ANDed together. The frontend's filter pills are a hardcoded list of common values, not pulled from actual data — there's no facet/distinct-values endpoint yet.

## Error shape

Both backend services return `{status, error, message, path, timestamp, fieldErrors?}` from a `@RestControllerAdvice`, for validation errors, 404/409s, and unhandled exceptions (500, no internal details leaked). The frontend shows the server's `message` on toast where there is one, a generic fallback otherwise, and a "session expired" toast on 401. Canceled requests (React StrictMode's double-effect abort/remount) are explicitly excluded from the toast — they used to show a false-positive error on every page load.

## Prod compose hardening

`docker-compose.prod.yml` runs the full stack in containers with a Caddy reverse proxy in front (`Caddyfile`) — it's the only container with published ports, TLS via Let's Encrypt for a real `DOMAIN` or a self-signed cert for `localhost`. `api-gateway` isn't reachable directly. All infra passwords and the JWT secret are required env vars (`:?` in compose) — missing any of them refuses to start rather than falling back to a default. `catalog-service` runs with `SPRING_PROFILES_ACTIVE=prod`, which strips the dev-fallback secret values entirely, so a missing secret fails at Spring context startup with a clear placeholder-resolution error instead of silently booting insecure. Every container has a `mem_limit` above its JVM `-Xmx` and a `HEALTHCHECK`.

Still local tooling for production-parity testing — no actual cloud target.
