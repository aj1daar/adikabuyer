# Adikabuyer

Custom-order catalog for a small drinkware/apparel shop — customers pick a product and variant; checkout persists the order and notifies the store's Telegram admins instead of going through a payment gateway. Prices shown to customers are entered directly by the admin per variant (no markup math); delivery is a flat 250 KGS to Бишкек and 500 KGS everywhere else.

## Stack

React, TypeScript, Vite, Tailwind, Spring Boot (catalog-service, order-service, api-gateway), PostgreSQL + Flyway, RabbitMQ, MinIO, Docker Compose.

catalog-service and order-service each own a separate Postgres database (`adikabuyer` and `adikabuyer_orders`) on the same instance, with independent Flyway migration histories. Both share the same `APP_JWT_SECRET`, so an admin token issued by catalog-service's `/api/auth/login` is also valid for order-service's admin-only `GET /api/orders`.

Request flow, auth, and the prod-hardening details live in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

The frontend follows a Neo-Y2K / Editorial Futurism design system: Unbounded typography (Space Grotesk is kept only for the logo wordmark), pill-shaped interactive elements, thick black borders (`border-2 border-black`), hard offset shadows instead of soft blurs, and a stark white / black / silver / bubblegum-pink palette. It is tuned for mobile Safari/Chrome: safe-area insets (`viewport-fit=cover`), 16px inputs to prevent iOS focus zoom, 44px touch targets, `dvh`-based drawer sizing, and scroll locking behind overlays. The catalog grid's mobile column count (1/2/3) is a customer-facing toggle, remembered in `localStorage`. Every storefront page (via `MainLayout`) sits on a fixed `SiteBackdrop` layer — a faint graph-paper grid plus a few hard-edged outline rings and squares, arranged differently per route (`home` / `catalog` / `product` / `about`) from the same shape vocabulary, and a `DotField` canvas whose dots roam the whole viewport along a slow flow field — smooth, non-repeating curves that curl away from the edges — each leaving a short fading trail (every dot has its own radius, speed, and field offset; disabled under `prefers-reduced-motion`). The landing hero and the About page each fill one desktop viewport (no scroll) as an asymmetric left/right spread; the hero's Instagram badge floats, its glow rotates, and an SVG dashed ring (evenly spaced via `pathLength`) spins around it, with faded `ScribbleNote` doodle arrows pointing at the CTAs. The nav bar carries its own tinted micro-grid, a dashed "sticker" frame around the logo, sparkle accents, animated link underlines, and spring-bounce hover on the logo and cart button.

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

## Known limitations / not done yet

- One hardcoded admin user. No signup, no password reset, no roles beyond admin/staff.
- Login rate limiter is in-memory — resets on restart, and won't work once there's more than one catalog-service instance.
- Catalog filter pills for color/size are a hardcoded list on the frontend (`utils/attributeOptions.ts`), not derived from real product data. The admin's size picker is dropdown-only from that same list, so sizes stay filterable; colour is a free-text field (the `ATTRIBUTE_VALUE_OPTIONS` presets are offered only as `<datalist>` autocomplete), so a hand-typed colour like `Мятный` won't match a filter pill. Volume is a real от/до numeric range instead (мл), not a preset. Admins can also add a fully custom attribute (free-typed key and value) for descriptive tags — those are shown on product cards but aren't filterable, by design. The category filter is derived from real data via a dedicated `GET /api/catalog/categories` distinct-values endpoint, scoped by the other active filters. Products also carry a separate optional `brand` (`product.brand`, its own admin input, migration `V9`); it isn't filterable and renders as a solid ink pill ahead of the bubblegum category label on both the card and the product page. A variant's SKU is optional in the admin form — left blank, the backend builds one from the variant's attributes (`ЧЁРНЫЙ-M-591`, ordered colour → size → volume → rest), appending `-2`, `-3`… on collision, and falls back to a `DEFAULT-…` placeholder only when the variant has no attributes. The form blocks saving a variant that repeats the same attribute key (two different volumes belong in two separate variants, not one). A product can also carry free-text labels (`Limited`, `С принтом`, …), stored on `product.labels`; `ProductLabels` renders them as rotated Neo-Y2K sticker badges — stacked on the catalog card's image corner, in a row beside the category on the product page. On top of those, the backend derives a non-stored `isNew` flag on `ProductDto` (`util/ProductFlags`, true for two weeks after `product.created_at`); the catalog card prepends a `Новинка` sticker when it's set, ahead of the admin's own labels. The catalog card caps colour swatches at four (the rest collapse into a `+N` link) and appends `+N` to an attribute tag when a product spans several values of it. On the product page each attribute (colour, size, volume, custom) is its own row of clickable values (`utils/variantSelection.ts`). Picking a value pins it and resolves to the closest variant: the just-touched attribute is a hard constraint, the other picks relax to the nearest real variant, and the page swaps in that variant's photo, price, and stock. A second click on an already-active value drops that pick (no variant is ever fully unselected — the row just stops constraining). Values that can't co-exist with the current picks are struck through. Per-combination photos come from `variant.imageUrls`; a variant with none borrows the gallery of the most attribute-similar variant that has one, so uploading a photo on one "чёрный" variant covers every "чёрный" size. Separately, each colour value can carry one round swatch image, stored per product in `product.color_swatches` (`{colourValue: url}`, pruned on save to colours the variants still use); the admin crops it from any photo with a mobile-friendly circular cropper (`components/admin/CircleCropper.tsx`, drag to pan, slider to zoom, exports a transparent-cornered PNG). The catalog card shows the swatches as a row of circles that swap the card photo on tap; the product page renders the colour row as circles with the colour name beneath.
- A variant has one of three states: `IN_STOCK`, `PRE_ORDER`, or `SOLD_OUT` (admin toggle on each variant). `SOLD_OUT` (like `PRE_ORDER`) forces the variant's stock to `0` and, unlike `PRE_ORDER`, also marks it inactive — the backend does this in `VariantReconciler` and the `InventoryListener`, so it holds however the variant is saved; the admin form has no per-variant active checkbox. `SOLD_OUT` variants are dropped from the storefront — hidden from the attribute selectors and the catalog card. A product whose variants are **all** `SOLD_OUT` is archived: excluded from `GET /api/catalog/products` and `/categories`, and `GET /api/catalog/products/{id}` returns 404. The admin dashboard passes `?includeArchived=true` so archived products stay visible there (with an "В архиве" badge) and can be brought back by switching a variant off `SOLD_OUT`.
- Base Docker images aren't digest-pinned. Deliberate — no release process yet that would benefit from it.
