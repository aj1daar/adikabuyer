#!/usr/bin/env sh
#
# One backup pass: dump both Postgres databases, gzip them, drop anything older
# than the retention window. Runs inside the db-backup container (see
# docker-compose.prod.yml), which has pg_dump and reaches postgres-db over the
# compose network.
#
# Manual run against a live stack:
#   docker compose -f docker-compose.prod.yml exec db-backup /scripts/backup-db.sh
#
set -eu

PGHOST="${PGHOST:-postgres-db}"
PGUSER="${POSTGRES_USER:-adikabuyer}"
CATALOG_DB="${POSTGRES_DB:-adikabuyer}"
ORDERS_DB="${CATALOG_DB}_orders"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

export PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

dump_one() {
  db="$1"
  target="$BACKUP_DIR/${db}-${stamp}.sql.gz"
  # write to .part first so a crashed/half-written dump is never mistaken for a
  # good backup, and never picked up by the restore instructions
  if pg_dump --host="$PGHOST" --username="$PGUSER" --dbname="$db" --no-owner --no-privileges \
      | gzip -9 > "${target}.part"; then
    mv "${target}.part" "$target"
    echo "[backup] $db -> $target ($(wc -c < "$target") bytes)"
  else
    rm -f "${target}.part"
    echo "[backup] FAILED for $db" >&2
    return 1
  fi
}

status=0
dump_one "$CATALOG_DB" || status=1
dump_one "$ORDERS_DB" || status=1

# prune only completed dumps; .part leftovers are cleaned by the failure path above
find "$BACKUP_DIR" -name '*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" -print -delete

echo "[backup] done at ${stamp}, retention ${RETENTION_DAYS}d, kept $(find "$BACKUP_DIR" -name '*.sql.gz' | wc -l) dumps"
exit "$status"
