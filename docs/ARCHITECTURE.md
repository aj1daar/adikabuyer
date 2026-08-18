# Architecture

## Services

| Service | Port | Notes |
|---|---|---|
| `frontend` | 5173 | Vite dev server, talks only to the gateway |
| `api-gateway` | 8080 | Spring Cloud Gateway, routes `/api/catalog/**` and `/api/orders/**`, handles CORS |
| `catalog-service` | 8081 | Products, variants, inventory, media upload, auth |
| `order-service` | 8082 | Checkout, order persistence, Telegram notifications, publishes order events |
| `postgres-db` | 5433 (host) | Hosts both `adikabuyer` (catalog) and `adikabuyer_orders` (orders), each with its own Flyway history |
| `rabbitmq` | 5672 / 15672 | Order-placed event bus |
| `minio` | 9000 / 9001 | Local S3 stand-in for product media |

In dev, `postgres-db`, `rabbitmq`, and `api-gateway` run in Docker; `catalog-service`, `order-service`, and the frontend run on the host, reached via `host.docker.internal`. `docker-compose.prod.yml` containerizes everything instead.

## Order flow

`POST /api/orders/checkout` persists the order and its line items to `order-service`'s own database (`customer_order`/`order_item`), publishes an `OrderPlacedEvent` to the `order.exchange`/`order.queue` topology, and notifies every registered Telegram admin chat with the order details — in that order, with the Telegram call wrapped so a delivery failure there never fails the checkout itself. `catalog-service` consumes the same RabbitMQ queue and decrements `variant.stock_quantity`; a variant flips from `IN_STOCK` to `PRE_ORDER` at zero stock. `GET /api/orders` (admin-only) lists persisted orders for the admin panel's Заказы tab.

Telegram admin registration: `order-service` long-polls `getUpdates` on a daemon thread (no public webhook needed) — set `TELEGRAM_BOT_TOKEN`/`TELEGRAM_REGISTRATION_PASSWORD` and message the bot the password to have that chat's id stored in `telegram_admin` and start receiving order notifications. Sending `/stop` removes the chat from `telegram_admin`. Without a token configured the poller and notifier no-op. Only run one instance of `order-service` against a given bot token at a time — two pollers race for the same `getUpdates` response, and whichever wins registers the admin in *its own* database, not necessarily the one you meant to update.

`DELETE /api/orders/{id}` (admin-only) hard-deletes an order and its items (cascade).

## Delivery pricing and commission

Delivery fee is a flat binary rule in `order-service`, not a per-city lookup table: `Бишкек` (case-insensitive, whitespace-trimmed) costs `app.delivery.bishkek-fee`, every other region costs `app.delivery.default-fee`. This used to be a `Map<String, BigDecimal>` keyed by city name, but a Cyrillic YAML map key (`бишкек: 250`) silently broke Spring's relaxed YAML-to-Map binding — the value flattened onto `app.delivery.fees` itself instead of a nested entry, and the app failed to boot. Plain scalar properties don't have that failure mode. The frontend's city dropdown (`DELIVERY_CITIES` in `utils/deliveryFee.ts`) mirrors this exact rule for a live cart preview only; the checkout response is what's actually charged.

`catalog-service` computes a `displayPrice` on every `ProductDto`/`VariantDto`: `round(cost * 1.15, nearest 100)`. Admins enter and edit the raw cost price (`basePrice`, `priceOverride`); every customer-facing surface (catalog, product page, cart, `ProductForm`'s live preview) reads `displayPrice`. The formula lives once in `catalog-service`'s `PriceCalculator`; the frontend admin-form preview duplicates it in `utils/priceCommission.ts` only as a same-page-load convenience before the real value comes back from the API on save.

## Auth

`catalog-service` write endpoints (`POST`/`PUT`/`DELETE` under `/api/catalog/**`) require a JWT with `ROLE_ADMIN`, issued by `POST /api/auth/login`. GETs stay public. One hardcoded admin user, bcrypt hash in `application.yml` for local dev, overridden by `APP_SECURITY_ADMIN_PASSWORD_HASH` in prod. Login is rate-limited to 5 attempts/min/IP, in-memory, resets on restart — fine for one instance, won't hold once there's more than one.

`order-service` doesn't issue tokens itself — `GET /api/orders` validates the same JWT via its own copy of the JWT filter/security config, trusting whatever `catalog-service` signed. This only works because both services are given the identical `APP_JWT_SECRET`; rotate it in one place without the other and cross-service auth breaks. `POST /api/orders/checkout` stays public, same as before.

401 vs 403: 401 is no/invalid token, 403 is a valid token with the wrong role. Both come back through a custom `AuthenticationEntryPoint`/`AccessDeniedHandler` so they get the same JSON error shape as everything else instead of Spring Security's default empty body.

## Media upload

`POST /api/media/upload` (admin-only) pushes the file to S3-compatible storage and returns a public URL, stored on `product.image_url`. Locally that's MinIO; point the `S3_*` env vars at Cloudflare R2 and it's the same code path. Bucket is created with a public-read policy on `catalog-service` startup if it doesn't exist. No resizing, no format conversion — whatever gets uploaded is what gets served.

## Catalog search/filter

`GET /api/catalog/products` takes `search`, `color`, `size`, `volume` query params. `search` is an `ILIKE` on product name; the attribute filters are native Postgres queries against the `variant.attributes` JSONB column (`attributes ->> 'color'`, etc.), case-insensitive, ANDed together. The frontend's filter pills are a hardcoded list of common values, not pulled from actual data — there's no facet/distinct-values endpoint yet.

## Error shape

Both backend services return `{status, error, message, path, timestamp, fieldErrors?}` from a `@RestControllerAdvice`, for validation errors, 404/409s, and unhandled exceptions (500, no internal details leaked). The frontend shows the server's `message` on toast where there is one, a generic fallback otherwise, and a "session expired" toast on 401. Canceled requests (React StrictMode's double-effect abort/remount) are explicitly excluded from the toast — they used to show a false-positive error on every page load.

## Prod compose hardening

`docker-compose.prod.yml` runs the full stack in containers with a Caddy reverse proxy in front (`Caddyfile`) — it's the only container with published ports, TLS via Let's Encrypt for a real `DOMAIN` or a self-signed cert for `localhost`. `api-gateway` isn't reachable directly. All infra passwords and the JWT secret are required env vars (`:?` in compose) — missing any of them refuses to start rather than falling back to a default. `catalog-service` runs with `SPRING_PROFILES_ACTIVE=prod`, which strips the dev-fallback secret values entirely, so a missing secret fails at Spring context startup with a clear placeholder-resolution error instead of silently booting insecure. Every container has a `mem_limit` above its JVM `-Xmx` and a `HEALTHCHECK`.

Live at `https://adikabuyer.kg` on a Hetzner VPS, deployed via `.github/workflows/deploy.yml` on every push to `main`.
