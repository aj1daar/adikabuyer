# Adikabuyer

E-commerce catalog application for custom product ordering. Customers browse products, pick variations (size/color/etc.), add them to a cart, and checkout generates a formatted WhatsApp message with the order details — no payment gateway involved.

This project is currently **local development only**. There is no cloud deployment configuration.

## Architecture

| Service | Tech | Port | Purpose |
|---|---|---|---|
| `frontend` | React + TypeScript + Vite + Tailwind | 5173 | Customer catalog/cart UI |
| `api-gateway` | Spring Cloud Gateway | 8080 | Single entry point, routes to backend services, handles CORS |
| `catalog-service` | Spring Boot + JPA + PostgreSQL + RabbitMQ | 8081 | Products, variants, inventory, consumes order events to deduct stock |
| `order-service` | Spring Boot + RabbitMQ | 8082 | Checkout, WhatsApp link generation, publishes order-placed events |
| `postgres-db` | PostgreSQL 16 | 5433 (host) | Catalog data, migrated via Flyway |
| `rabbitmq` | RabbitMQ 3.13 (management) | 5672 / 15672 | Order-placed event bus |
| `minio` | MinIO | 9000 / 9001 (console) | Local S3-compatible stand-in for Cloudflare R2, product media storage |

The frontend talks only to the API gateway (`http://localhost:8080`), which routes `/api/catalog/**` to `catalog-service` and `/api/orders/**` to `order-service`.

`postgres-db`, `rabbitmq`, and `api-gateway` run in Docker (`docker-compose.yml`). `catalog-service`, `order-service`, and the frontend dev server currently run directly on the host — the gateway reaches them via `host.docker.internal`.

When `order-service` publishes an order to the `order.exchange`/`order.queue` RabbitMQ topology, `catalog-service` consumes the same queue and deducts purchased quantities from `variant.stock_quantity`. A variant's `status` flips from `IN_STOCK` to `PRE_ORDER` once its stock reaches zero.

`catalog-service` write endpoints (`POST`/`PUT`/`DELETE` under `/api/catalog/**`) require a JWT with `ROLE_ADMIN`, obtained from `POST /api/auth/login` (routed through the gateway). `GET` endpoints stay public. Local dev admin credentials: username `admin`, password `admin123` (hash lives in `catalog-service/application.yml`, for local development only).

The frontend is routed with `react-router-dom`: `/` is the public storefront, `/admin/login` is the admin login form, `/admin` is the protected dashboard (redirects to `/admin/login` if no JWT is stored). The JWT is kept in a persisted Zustand store (`localStorage`) and attached to `catalog-service` write requests automatically. `catalog-service` implements `POST`/`PUT /{id}`/`DELETE /{id}` on `/api/catalog/products` (`ROLE_ADMIN` required): create/update accept a product with a nested variant list, variants are reconciled by id (missing id = new variant, id absent from the request = removed), and duplicate SKUs return `409`.

`catalog-service` uploads product images to S3-compatible storage via `POST /api/media/upload` (`ROLE_ADMIN` required, routed through the gateway), returning a public object URL. Locally this talks to the `minio` container; in a real environment it points at Cloudflare R2 via the same S3 API (configured through `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_PUBLIC_URL_BASE` env vars). The target bucket is created automatically on `catalog-service` startup if missing, with a public-read policy applied so returned URLs are actually fetchable. `product.image_url` stores the result; the admin `ProductForm` uploads the selected file immediately on selection and includes the returned URL in the create/update payload.

`catalog-service` and `order-service` both return a standardized JSON error envelope from a `@RestControllerAdvice` (`{status, error, message, path, timestamp, fieldErrors?}`) for validation failures, malformed JSON, not-found/conflict errors, and unexpected exceptions (500, without leaking internal details). In `catalog-service`, 401/403 from Spring Security itself (missing/invalid JWT, insufficient role) go through a custom `AuthenticationEntryPoint`/`AccessDeniedHandler` so they get the same JSON shape instead of Spring Security's default empty body — `401` means no/invalid credentials, `403` means authenticated but the wrong role.

The frontend wraps the app root in an `ErrorBoundary` (`main.tsx`) so a rendering crash shows a fallback screen instead of a blank page. `catalogClient`, `orderClient`, and `mediaClient` all show a `react-hot-toast` notification on API errors — the server's `message` field when present, a "session expired" message on `401`, a generic fallback otherwise. `authClient` (login) is intentionally excluded since `Login.tsx` already surfaces its own inline error.

## Running locally

1. Start infrastructure and the gateway:
   ```bash
   docker compose up -d
   ```

2. Build and run the backend services (separate terminals):
   ```bash
   cd catalog-service && mvn clean package -DskipTests
   java -jar target/catalog-service-0.0.1-SNAPSHOT.jar

   cd order-service && mvn clean package -DskipTests
   java -jar target/order-service-0.0.1-SNAPSHOT.jar
   ```

3. Start the frontend dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173`.

RabbitMQ management UI: `http://localhost:15672` (user/pass: `adikabuyer` / `adikabuyer`).

MinIO console: `http://localhost:9001` (user/pass: `adikabuyer` / `adikabuyer123`).

## Testing

```bash
cd catalog-service && mvn test
cd order-service && mvn test
cd frontend && npm run test
```

Coverage reports: `mvn test` generates a JaCoCo report at `target/site/jacoco/index.html` for each backend service; `npx vitest run --coverage` generates one at `frontend/coverage/index.html`.

## Running the production-style stack locally

`catalog-service`, `order-service`, and `api-gateway` each have a multi-stage `Dockerfile` (Maven build stage, `eclipse-temurin` JRE Alpine runtime stage, non-root user). `docker-compose.prod.yml` runs the entire stack — Postgres, RabbitMQ, MinIO, and all three Java services — as containers on one Docker network, using container DNS names (`postgres-db`, `rabbitmq`, `minio`, `catalog-service`, `order-service`) instead of `host.docker.internal`. Each service's JVM heap is capped via a `JAVA_OPTS` env var (default `-Xmx256m -Xms128m`, override per-service with `CATALOG_SERVICE_JAVA_OPTS` / `ORDER_SERVICE_JAVA_OPTS` / `GATEWAY_JAVA_OPTS`) to avoid OOM kills on small hosts.

Copy `.env.prod.example` to `.env.prod` and fill in real values — `POSTGRES_PASSWORD`, `RABBITMQ_PASSWORD`, `MINIO_ROOT_PASSWORD`, `APP_JWT_SECRET`, and `APP_SECURITY_ADMIN_PASSWORD_HASH` are all required (compose refuses to start without them); everything else has a local-friendly default. Note: literal `$` characters (e.g. in a bcrypt hash) must be escaped as `$$` in `.env.prod`, or Compose's variable interpolation will silently corrupt the value.

`catalog-service` always runs with `SPRING_PROFILES_ACTIVE=prod` in its container (baked into the `Dockerfile`), which activates `application-prod.yml`: this removes the local-dev fallback values for `APP_JWT_SECRET`/`APP_SECURITY_ADMIN_PASSWORD_HASH`, so the app fails fast at startup with a clear `Could not resolve placeholder` error if either is missing, rather than silently running with a known default, and disables verbose SQL logging.

All three Java services expose a Docker `HEALTHCHECK` (`catalog-service` via HTTP against its own public `GET /api/catalog/products`; `order-service`/`api-gateway`, which have no suitable public GET endpoint, via a TCP check on their listening port). Every service in `docker-compose.prod.yml` also has a `mem_limit` set above its JVM `-Xmx` to cap total container memory (heap plus off-heap usage like metaspace and thread stacks), so one runaway container can't take down the host.

`api-gateway` is not exposed on a host port in the prod stack — a `caddy` reverse proxy (`Caddyfile`, repo root) is the only container with published ports (80/443) and terminates TLS in front of it. With `DOMAIN=localhost` (the default), Caddy issues itself a local, self-signed certificate for `https://localhost`; set `DOMAIN` to a real hostname pointing at the host to get automatic Let's Encrypt HTTPS instead. `CORS_ALLOWED_ORIGIN` should be set to match wherever the frontend is actually served from once it's not `localhost:5173`.

`catalog-service` rate-limits `POST /api/auth/login` to 5 attempts per minute per client IP (in-memory, resets on restart) to slow down credential brute-forcing; a 6th attempt within the window gets `429 Too Many Requests`. This relies on `server.forward-headers-strategy: framework` to read the real client IP forwarded by Caddy/the gateway rather than the proxy's own address.

```bash
cp .env.prod.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

This is still local tooling for production-parity testing, not a cloud deployment — no cloud-provider-specific config is included.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs the backend and frontend test suites on every push and pull request to `main`.

## Project structure

```
catalog-service/   Spring Boot - product catalog, inventory, order event consumer
order-service/     Spring Boot - checkout, WhatsApp link, RabbitMQ events
api-gateway/        Spring Cloud Gateway - single entry point + CORS
frontend/          React + TypeScript + Tailwind - customer UI
docker-compose.yml       Local infrastructure (Postgres, RabbitMQ, MinIO, API gateway)
docker-compose.prod.yml  Full containerized stack for production-parity local testing
.env.prod.example        Required/optional env vars for docker-compose.prod.yml
```

---
