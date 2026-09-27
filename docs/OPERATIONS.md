# Operations

Production runs on a Hetzner VPS at [adikabuyer.kg](https://adikabuyer.kg). DNS is on Cloudflare, with the nameservers delegated from cctld.kg. Everything runs from `docker-compose.prod.yml` in `/opt/adikabuyer`.

## Deploy

1. A merge to `main` triggers CI.
2. When CI passes for that push, `.github/workflows/deploy.yml` starts (a `workflow_run` trigger; `workflow_dispatch` is there for manual runs).
3. The job connects over SSH, resets `/opt/adikabuyer` to the exact commit CI tested, writes `.env.prod`, and runs `docker compose up -d --build`.
4. `api-gateway` and `caddy` are then recreated on purpose: the gateway so it picks up the new service addresses, Caddy so it rereads its bind-mounted `Caddyfile`.

Each deploy runs any new Flyway migrations. There's a short outage while containers restart.

### GitHub secrets

| Secret | Purpose |
| --- | --- |
| `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` | Access to the server |
| `ENV_PROD_B64` | The whole `.env.prod`, base64-encoded (a plain value breaks on the `$` signs in the bcrypt hash) |
| `BACKUP_S3_ENDPOINT`, `BACKUP_S3_BUCKET`, `BACKUP_S3_ACCESS_KEY`, `BACKUP_S3_SECRET_KEY` | Optional. Appended to `.env.prod` on each deploy, so off-site backup keys can be rotated without re-encoding the env file |

To change a value in `ENV_PROD_B64`, edit `.env.prod` on the server, then run `base64 -w0 .env.prod` and paste the output into the secret. If you only edit the file on the server, the next deploy overwrites it.

## Telegram bot

order-service polls the Telegram Bot API (long polling, so no public webhook is needed).

**Setup:**
1. Create a bot with [@BotFather](https://t.me/BotFather).
2. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_REGISTRATION_PASSWORD`.
3. Message the bot `/start`, then send the password. That chat is now an admin chat, stored in `telegram_admin`. `/stop` unsubscribes it.

**What admins get:**
- A message for every new order, with ✅ Подтвердить / ❌ Отменить buttons. A tap changes the status using the same rules as the admin panel, and the message is updated to show the result and who acted.
- An «Открыть админку» link on each order, when `TELEGRAM_ADMIN_URL` is a public https address (Compose defaults it to `https://$DOMAIN/admin`).
- A «⚠️ Заканчивается» alert when an order leaves an in-stock variant at `TELEGRAM_LOW_STOCK_THRESHOLD` units or fewer (default 2).
- Alerts from the monitor (below).

**Registration is guarded,** because admin chats see every customer's name and phone:
- The password check is constant-time.
- Each chat gets 5 tries per hour, and the whole bot 30.
- Every existing admin chat is told when a new one subscribes.

Without a token the bot is simply off; checkout and the admin panel work either way. Run only one order-service per bot token, or two pollers will race for the same updates.

## Monitoring

The `monitor` container (`scripts/monitor.sh`) checks the following every minute:
- catalog-service, order-service, api-gateway and Caddy;
- Postgres, RabbitMQ and MinIO;
- disk usage (alerts at 85%, `MONITOR_DISK_ALERT_PERCENT`);
- that a database dump newer than two backup intervals exists;
- that an off-site copy has landed, once off-site backups are configured.

It messages the Telegram admin chats only when a check changes state: one «⚠️ … не отвечает» when it breaks, one «✅ … снова работает» when it recovers. Without a bot token it only writes to its log.

```bash
docker compose -f docker-compose.prod.yml logs monitor
docker compose -f docker-compose.prod.yml exec monitor sh /scripts/monitor.sh --once
```

It can't report the whole server going down. For that, add an external check, for example an UptimeRobot HTTPS monitor on the site every 5 minutes, sending alerts to Telegram.

## Backups

### Local dumps

The `db-backup` container (`scripts/backup-db.sh`) dumps both databases at startup and then every `BACKUP_INTERVAL_SECONDS` (default 24 hours). The gzipped dumps go into the `db-backups` volume and are deleted after `BACKUP_RETENTION_DAYS` (default 14). If Postgres is unreachable, the run fails and leaves no file behind, so a broken dump never looks like a fresh one.

```bash
docker compose -f docker-compose.prod.yml exec db-backup ls -la /backups          # list dumps
docker compose -f docker-compose.prod.yml exec db-backup sh /scripts/backup-db.sh  # dump now
docker cp adikabuyer-db-backup:/backups ./local-backups                           # copy them off the server
```

**To restore a database** (this overwrites it; restore into a scratch database first if you only want to look):

```bash
docker compose -f docker-compose.prod.yml exec db-backup \
  sh -c 'gunzip -c /backups/adikabuyer-<stamp>.sql.gz' \
  | docker compose -f docker-compose.prod.yml exec -T postgres-db psql -U adikabuyer -d adikabuyer
```

### Off-site copies

Local dumps protect against mistakes, such as a deleted product or a bad migration, but they sit on the same disk as the database. The `backup-offsite` container (`scripts/backup-offsite.sh`, using MinIO's `mc`) covers losing the server. Every `BACKUP_OFFSITE_INTERVAL_SECONDS` (default 24 hours) it copies:
- the dumps to `<bucket>/<prefix>/db/`;
- all product photos to `<bucket>/<prefix>/media/`.

Remote dumps older than `BACKUP_OFFSITE_RETENTION_DAYS` (default 30) are deleted. Any S3-compatible storage works; production uses Cloudflare R2.

Configure it with the four `BACKUP_S3_*` variables, as GitHub secrets or directly in `.env.prod`. Without them it only logs a reminder.

```bash
docker compose -f docker-compose.prod.yml logs backup-offsite
docker compose -f docker-compose.prod.yml exec backup-offsite sh /scripts/backup-offsite.sh --once
```

**To restore from the bucket:**
1. Download a dump: `mc cp offsite/<bucket>/<prefix>/db/<dump>.sql.gz .`
2. Load it with the `gunzip | psql` command above.
3. Restore photos with `mc mirror offsite/<bucket>/<prefix>/media local/adikabuyer-media`.

## Container images

MinIO stopped publishing free public images in September 2025: both `docker.io/minio/minio` and `quay.io/minio/minio` now refuse anonymous pulls, including the digests this repo used to pin, which broke every clean build. The stack uses Bitnami's archived copies instead (`bitnamilegacy/minio` and `bitnamilegacy/minio-client`), pinned by digest. It is the same MinIO server and the same on-disk layout, so existing data keeps working, but those images are frozen and get no further updates. Moving the photo storage to a maintained S3-compatible server is open work.

Both containers run as root, because the existing volumes are root-owned while Bitnami images default to uid 1001.

## Scripts

Every `*.sh` file is kept with LF line endings (`.gitattributes`) and run through `sh`, so the scripts work from a Windows checkout and don't depend on the executable bit.
