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

The frontend talks only to the API gateway (`http://localhost:8080`), which routes `/api/catalog/**` to `catalog-service` and `/api/orders/**` to `order-service`.

`postgres-db`, `rabbitmq`, and `api-gateway` run in Docker (`docker-compose.yml`). `catalog-service`, `order-service`, and the frontend dev server currently run directly on the host — the gateway reaches them via `host.docker.internal`.

When `order-service` publishes an order to the `order.exchange`/`order.queue` RabbitMQ topology, `catalog-service` consumes the same queue and deducts purchased quantities from `variant.stock_quantity`. A variant's `status` flips from `IN_STOCK` to `PRE_ORDER` once its stock reaches zero.

`catalog-service` write endpoints (`POST`/`PUT`/`DELETE` under `/api/catalog/**`) require a JWT with `ROLE_ADMIN`, obtained from `POST /api/auth/login` (routed through the gateway). `GET` endpoints stay public. Local dev admin credentials: username `admin`, password `admin123` (hash lives in `catalog-service/application.yml`, for local development only).

The frontend is routed with `react-router-dom`: `/` is the public storefront, `/admin/login` is the admin login form, `/admin` is the protected dashboard (redirects to `/admin/login` if no JWT is stored). The JWT is kept in a persisted Zustand store (`localStorage`) and attached to `catalog-service` write requests automatically. Note: `catalog-service` does not yet implement the actual `POST`/`PUT`/`DELETE` product handlers — the admin dashboard's create/update/delete actions are wired but will 405 until those endpoints exist.

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

## Testing

```bash
cd catalog-service && mvn test
cd order-service && mvn test
cd frontend && npm run test
```

Coverage reports: `mvn test` generates a JaCoCo report at `target/site/jacoco/index.html` for each backend service; `npx vitest run --coverage` generates one at `frontend/coverage/index.html`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs the backend and frontend test suites on every push and pull request to `main`.

## Project structure

```
catalog-service/   Spring Boot - product catalog, inventory, order event consumer
order-service/     Spring Boot - checkout, WhatsApp link, RabbitMQ events
api-gateway/        Spring Cloud Gateway - single entry point + CORS
frontend/          React + TypeScript + Tailwind - customer UI
docker-compose.yml  Local infrastructure (Postgres, RabbitMQ, API gateway)
```

---
