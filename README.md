# Adikabuyer

Online catalog for a small made-to-order shop (tumblers, clothing, shoes). Customers pick a product and a variant and place an order on the site. There is no online payment: the order is saved, the shop's admins get it in Telegram, and they call the customer to confirm.

Live at [adikabuyer.kg](https://adikabuyer.kg).

## How ordering works

- Prices are set by the admin per variant. What the customer sees is what they pay for the item.
- Delivery is Бишкек only: 300 KGS by courier, or free pickup.
- Parcel weight is charged on top. The site shows the tariff (`frontend/src/utils/weightSurcharge.ts`), and the exact amount is agreed when the order is confirmed.
- Orders move through Новый → Подтверждён → Выкуплен → В пути → Доставлен, or Отменён. Cancelling an open order returns its stock.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind, framer-motion, zustand
- **Backend:** Spring Boot 4.1 on Java 21: `catalog-service`, `order-service`, and `api-gateway` (Spring Cloud Gateway)
- **Data:** PostgreSQL with Flyway (one database per service), RabbitMQ between the services, MinIO for photos
- **Infra:** Docker Compose, Caddy (HTTPS, static files, proxy), GitHub Actions

## Documentation

| Doc | What's in it |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Services, order flow, auth, search, error format, framework notes |
| [docs/CATALOG.md](docs/CATALOG.md) | Products, variants, attributes, stock states, labels, swatches |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Design system, storefront behaviour, admin panel |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Deploy, secrets, Telegram bot, monitoring, backups |
| [docs/SECURITY.md](docs/SECURITY.md) | What's hardened, the server checklist, accepted limitations |

## Run locally

You need Docker and git-bash. `scripts/local.sh` covers both setups. The admin login is `admin` / `devpassword`.

Full stack at `http://localhost`:

```bash
scripts/local.sh up       # writes a throwaway .env, builds, waits until healthy
scripts/local.sh smoke    # end-to-end smoke test against the running stack
scripts/local.sh down     # stop and keep data; `reset` also wipes volumes
```

Dev mode, with the infrastructure in Docker and the apps on your machine for hot reload:

```bash
scripts/local.sh infra                            # Postgres, RabbitMQ, MinIO, gateway
cd catalog-service && mvn spring-boot:run         # :8081
cd order-service   && mvn spring-boot:run         # :8082
cd frontend        && npm install && npm run dev  # http://localhost:5173
```

Demo data: `scripts/seed-demo.sh [base-url] [user] [pass]` adds 10 products with photos, attributes and labels. Run it once on an empty database.

If Postgres runs on an old volume that predates `postgres-init/`, create the orders database by hand:

```bash
docker exec adikabuyer-dev-postgres psql -U adikabuyer -d adikabuyer -c "CREATE DATABASE adikabuyer_orders"
```

## Tests

```bash
cd catalog-service && mvn test
cd order-service   && mvn test
cd frontend        && npm run test
scripts/e2e-smoke.sh <base-url> <user> <pass>   # against a running stack
```

CI runs all of these, plus a dependency scan, on every pull request. `main` only accepts merges with green checks.

## Deploy

Merging to `main` runs CI. When it passes, `.github/workflows/deploy.yml` connects to the server over SSH, checks out that exact commit and rebuilds the Compose stack. Details and the list of GitHub secrets are in [docs/OPERATIONS.md](docs/OPERATIONS.md#deploy).

To run the production setup yourself:

```bash
cp .env.prod.example .env.prod   # fill in the values
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Backups and monitoring

- Both databases are dumped daily and kept for 14 days. A second job copies the dumps and all product photos to an S3-compatible bucket (Cloudflare R2 in production) and keeps them for 30 days.
- A monitor container checks every service, the disk, and backup freshness each minute, and messages the Telegram admins when something breaks or recovers.
- It can't report the whole server going down, so also point an external uptime check (for example UptimeRobot) at the site.

Commands and restore steps are in [docs/OPERATIONS.md](docs/OPERATIONS.md#backups).

## Known limitations

- One admin account. No sign-up, password reset or per-person accounts.
- The login and checkout rate limits live in memory, so they reset on restart and don't work across several instances. Checkout allows 5 orders per IP per 10 minutes (`APP_SECURITY_CHECKOUT_MAX_PER_IP`; local setups use 100).
- Colour and size filters use a fixed list of values. A colour typed by hand in the admin form won't match a filter.
- The site renders in the browser, so shared product links don't show the product's photo or title in previews.
- `sitemap.xml` and `robots.txt` still use the placeholder domain `adikabuyer.com`.
- Dependabot opens one grouped minor/patch PR per ecosystem each month, plus security fixes. Major upgrades, and the Java and Node versions in the Docker images, are done by hand.
