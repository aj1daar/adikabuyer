#!/usr/bin/env sh
#
# Watchdog for the production stack. Runs in the `monitor` sidecar (postgres image:
# pg_isready, psql, busybox wget/nc) and loops forever. Every pass it checks the
# services, Postgres, free disk and the age of the newest backup, and messages every
# registered Telegram admin chat when a check CHANGES state — once when something
# breaks, once when it recovers — so a long outage is one alert, not hundreds.
#
# Without TELEGRAM_BOT_TOKEN it only logs.
#
# One pass by hand:  docker compose -f docker-compose.prod.yml exec monitor sh /scripts/monitor.sh --once
#
set -u

INTERVAL="${MONITOR_INTERVAL_SECONDS:-60}"
DISK_ALERT_PERCENT="${MONITOR_DISK_ALERT_PERCENT:-85}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
# a backup older than two intervals (+1h slack) means the nightly pass failed or stopped
BACKUP_MAX_AGE_SECONDS="${MONITOR_BACKUP_MAX_AGE_SECONDS:-$(( ${BACKUP_INTERVAL_SECONDS:-86400} * 2 + 3600 ))}"
STATE_DIR="${MONITOR_STATE_DIR:-/tmp/monitor-state}"
TELEGRAM_API_BASE="${TELEGRAM_API_BASE:-https://api.telegram.org}"
SITE_LABEL="${DOMAIN:-adikabuyer}"
PGHOST="${PGHOST:-postgres-db}"
PGUSER="${POSTGRES_USER:-adikabuyer}"
ORDERS_DB="${POSTGRES_DB:-adikabuyer}_orders"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"

mkdir -p "$STATE_DIR"

log() { echo "[monitor] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }

# HTTP status of a URL, or 000 when nothing answered. Any 1xx-4xx means the app is up
# (the order API answers 401 to an anonymous probe, which is exactly what we want).
http_status() {
  # busybox prints the status line twice on errors ("  HTTP/1.1 401" and "wget: server returned
  # error: HTTP/1.1 401"), so pull the number that follows "HTTP/x.y" rather than a fixed field
  wget -S -q -T 8 -O /dev/null "$1" 2>&1 \
    | sed -n 's/.*HTTP\/[0-9.]* \([0-9][0-9][0-9]\).*/\1/p' | tail -1 | grep . || echo 000
}

check_http() { code="$(http_status "$1")"; [ "$code" -ge 100 ] 2>/dev/null && [ "$code" -lt 500 ]; }
check_tcp() { nc -z -w 5 "$1" "$2" >/dev/null 2>&1; }
check_postgres() { pg_isready -q -h "$PGHOST" -U "$PGUSER" -t 5; }

disk_percent() { df -P "$BACKUP_DIR" | awk 'NR==2 {gsub("%", "", $5); print $5}'; }
check_disk() { [ "$(disk_percent)" -lt "$DISK_ALERT_PERCENT" ]; }

check_backup_fresh() {
  newest="$(find "$BACKUP_DIR" -name '*.sql.gz' -type f -exec stat -c %Y {} \; 2>/dev/null | sort -n | tail -1)"
  [ -n "$newest" ] && [ $(( $(date +%s) - newest )) -lt "$BACKUP_MAX_AGE_SECONDS" ]
}

admin_chat_ids() {
  psql -h "$PGHOST" -U "$PGUSER" -d "$ORDERS_DB" -tAc "SELECT chat_id FROM telegram_admin" 2>/dev/null
}

notify() {
  text="$1"
  log "ALERT: $text"
  [ -n "${TELEGRAM_BOT_TOKEN:-}" ] || return 0
  for chat in $(admin_chat_ids); do
    # the texts are fixed strings built below (no quotes or backslashes), so plain JSON is safe
    wget -q -T 10 -O /dev/null --header 'Content-Type: application/json' \
      --post-data "{\"chat_id\": $chat, \"text\": \"$text\"}" \
      "$TELEGRAM_API_BASE/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
      || log "could not deliver alert to chat $chat"
  done
}

# report(key, ok?, what-broke text, what-recovered text): alert only on a state flip
report() {
  key="$1"; healthy="$2"; down_text="$3"; up_text="$4"
  file="$STATE_DIR/$key"
  previous="$(cat "$file" 2>/dev/null || echo up)"
  current=$([ "$healthy" = 0 ] && echo up || echo down)
  if [ "$current" != "$previous" ]; then
    if [ "$current" = down ]; then notify "⚠️ $SITE_LABEL: $down_text"; else notify "✅ $SITE_LABEL: $up_text"; fi
  fi
  echo "$current" > "$file"
}

run_pass() {
  check_http "http://catalog-service:8081/api/catalog/products?pageSize=1"; report catalog $? "каталог (catalog-service) не отвечает" "каталог снова работает"
  check_http "http://order-service:8082/api/orders"; report orders $? "заказы (order-service) не отвечают — оформление не работает" "оформление заказов снова работает"
  check_tcp api-gateway 8080; report gateway $? "api-gateway не отвечает — сайт не видит API" "api-gateway снова работает"
  check_tcp caddy 80; report caddy $? "веб-сервер (caddy) не отвечает — сайт недоступен" "веб-сервер снова работает"
  check_postgres; report postgres $? "база данных не отвечает" "база данных снова работает"
  check_tcp rabbitmq 5672; report rabbitmq $? "RabbitMQ не отвечает — остатки не списываются" "RabbitMQ снова работает"
  check_http "http://minio:9000/minio/health/live"; report minio $? "хранилище фото (MinIO) не отвечает" "хранилище фото снова работает"
  check_disk; report disk $? "диск заполнен на $(disk_percent)% (порог ${DISK_ALERT_PERCENT}%)" "на диске снова есть место ($(disk_percent)%)"
  check_backup_fresh; report backup $? "свежей резервной копии базы нет больше $((BACKUP_MAX_AGE_SECONDS / 3600)) ч" "резервные копии базы снова создаются"
  log "pass done"
}

if [ "${1:-}" = "--once" ]; then
  run_pass
  exit 0
fi

log "started: every ${INTERVAL}s, disk alert at ${DISK_ALERT_PERCENT}%, backup max age ${BACKUP_MAX_AGE_SECONDS}s"
while true; do
  run_pass
  sleep "$INTERVAL"
done
