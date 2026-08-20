# Adikabuyer

Custom-order catalog for a small drinkware/apparel shop — customers pick a product and variant; checkout persists the order and notifies the store's Telegram admins instead of going through a payment gateway. Prices shown to customers are the admin-entered cost price plus a 15% commission, rounded to the nearest 100; delivery is a flat 250 KGS to Бишкек and 500 KGS everywhere else.

## Stack

React, TypeScript, Vite, Tailwind, Spring Boot (catalog-service, order-service, api-gateway), PostgreSQL + Flyway, RabbitMQ, MinIO, Docker Compose.

catalog-service and order-service each own a separate Postgres database (`adikabuyer` and `adikabuyer_orders`) on the same instance, with independent Flyway migration histories. Both share the same `APP_JWT_SECRET`, so an admin token issued by catalog-service's `/api/auth/login` is also valid for order-service's admin-only `GET /api/orders`.

Request flow, auth, and the prod-hardening details live in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

The frontend follows a Neo-Y2K / Editorial Futurism design system: Space Grotesk typography, pill-shaped interactive elements, thick black borders (`border-2 border-black`), hard offset shadows instead of soft blurs, and a stark white / black / silver / bubblegum-pink palette. It is tuned for mobile Safari/Chrome: safe-area insets (`viewport-fit=cover`), 16px inputs to prevent iOS focus zoom, 44px touch targets, `dvh`-based drawer sizing, and scroll locking behind overlays.

## Run it

```bash
docker compose up -d

cd catalog-service && mvn clean package -DskipTests && java -jar target/catalog-service-0.0.1-SNAPSHOT.jar
cd order-service && mvn clean package -DskipTests && java -jar target/order-service-0.0.1-SNAPSHOT.jar

cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`. Admin login: `admin` / `admin123`.

First run only: `docker compose up -d` creates `adikabuyer_orders` automatically via `postgres-init/`. If the Postgres volume already existed before that script was added, create it once by hand: `docker exec adikabuyer-postgres psql -U adikabuyer -d adikabuyer -c "CREATE DATABASE adikabuyer_orders"`.

Tests: `mvn test` in each backend service, `npm run test` in `frontend`.

### Telegram order notifications

order-service polls the Telegram Bot API (long polling, no public webhook needed) and notifies registered admin chats whenever a checkout completes. To wire it up locally: create a bot via [@BotFather](https://t.me/BotFather), then run order-service with `TELEGRAM_BOT_TOKEN` and `TELEGRAM_REGISTRATION_PASSWORD` set. Message the bot `/start`, then send the registration password as plain text — the chat is stored in the `telegram_admin` table and starts receiving order notifications. Send `/stop` to unsubscribe. Without a token configured, the poller and notifier silently no-op (checkout and the admin panel still work). Run only one `order-service` instance against a given bot token — two pollers racing for the same `getUpdates` response will register an admin in whichever instance's database won the race.

Production-parity stack, fully containerized with TLS (Caddy serves the built frontend, proxies `/api/*` to the gateway and `/media/*` to MinIO):

```bash
cp .env.prod.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Deploy

Live at `https://adikabuyer.kg` (Hetzner VPS, DNS via Cloudflare, NS delegated from cctld.kg). Pushing to `main` triggers `.github/workflows/deploy.yml`: it SSHes into the production server (`/opt/adikabuyer`), resets to `origin/main`, writes `.env.prod` from the base64-encoded `ENV_PROD_B64` secret (plain env content breaks on the bcrypt hash's `$` signs when piped through a shell, hence the base64 wrapping), and rebuilds the compose stack, force-recreating `caddy` separately since its config is bind-mounted and won't otherwise pick up changes. Required GitHub secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `ENV_PROD_B64`.

SEO basics are in place: meta description and Open Graph tags in `index.html`, per-page titles via `usePageTitle`, JSON-LD Product markup on product pages, `robots.txt` (blocks `/admin`), and a static `sitemap.xml`. The sitemap and robots URLs use the placeholder domain `adikabuyer.com` — replace it on deploy. Being a client-rendered SPA, link previews for individual products still need prerendering/SSR.

**One-time manual step for this deploy**: `catalog-service`'s `order.queue` now declares dead-letter routing args. RabbitMQ won't let an existing durable queue's arguments change, so before this lands, delete `order.queue` on the prod broker by hand (management UI or `rabbitmqctl`) — otherwise `catalog-service` fails to start with a `PRECONDITION_FAILED` error. Safe to do; anything in flight just gets redelivered and reprocessed once the service reconnects.

## Known limitations / not done yet

- One hardcoded admin user. No signup, no password reset, no roles beyond admin/staff.
- Login rate limiter is in-memory — resets on restart, and won't work once there's more than one catalog-service instance.
- Telegram admin registration has no admin-list UI in the dashboard — checking who's subscribed means querying the `telegram_admin` table directly (unsubscribing is self-service via `/stop`).
- Catalog filter pills for color/size are a hardcoded list on the frontend (`utils/attributeOptions.ts`), not derived from real product data — the admin's color/size picker is dropdown-only from that exact same list, so those values are guaranteed filterable. Volume is a real от/до numeric range instead (мл), not a preset. Admins can also add a fully custom attribute (free-typed key and value) for descriptive tags — those are shown on product cards but aren't filterable, by design. The category filter is derived from real data, but only via a second unfiltered fetch on every page load; there's still no dedicated distinct-values endpoint.
- No pagination on `/api/catalog/products`. Fine for a few dozen products, not forever.
- No image resizing on upload — whatever the admin picks goes to MinIO/R2 at full size.
- Base Docker images aren't digest-pinned. Deliberate — no release process yet that would benefit from it.
