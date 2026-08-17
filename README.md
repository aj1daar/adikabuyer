# Adikabuyer

Custom-order catalog for a small drinkware/apparel shop — customers pick a product and variant, cart checkout hands off to WhatsApp instead of a payment gateway.

## Stack

React, TypeScript, Vite, Tailwind, Spring Boot (catalog-service, order-service, api-gateway), PostgreSQL + Flyway, RabbitMQ, MinIO, Docker Compose.

Request flow, auth, and the prod-hardening details live in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

The frontend follows a Neo-Y2K / Editorial Futurism design system: Space Grotesk typography, pill-shaped interactive elements, thick black borders (`border-2 border-black`), hard offset shadows instead of soft blurs, and a stark white / black / silver / bubblegum-pink palette.

## Run it

```bash
docker compose up -d

cd catalog-service && mvn clean package -DskipTests && java -jar target/catalog-service-0.0.1-SNAPSHOT.jar
cd order-service && mvn clean package -DskipTests && java -jar target/order-service-0.0.1-SNAPSHOT.jar

cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`. Admin login: `admin` / `admin123`.

Tests: `mvn test` in each backend service, `npm run test` in `frontend`.

Production-parity stack, fully containerized with TLS:

```bash
cp .env.prod.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Known limitations / not done yet

- No cloud deploy. The prod compose file is for local production-parity testing, not a real target.
- One hardcoded admin user. No signup, no password reset, no roles beyond admin/staff.
- Login rate limiter is in-memory — resets on restart, and won't work once there's more than one catalog-service instance.
- order-service doesn't persist orders anywhere. It publishes to RabbitMQ and hands back a WhatsApp link; if nothing's listening, the order's gone.
- Catalog filter pills (color/size/volume) are a hardcoded list on the frontend, not derived from real product data. Tag a product with a color that's not on the list and it's unfilterable.
- No pagination on `/api/catalog/products`. Fine for a few dozen products, not forever.
- No image resizing on upload — whatever the admin picks goes to MinIO/R2 at full size.
- Base Docker images aren't digest-pinned. Deliberate — no release process yet that would benefit from it.
