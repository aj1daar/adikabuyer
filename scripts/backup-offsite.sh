#!/usr/bin/env sh
#
# Off-site copy of everything the VPS can't afford to lose. Runs in the backup-offsite
# sidecar (minio/mc image) and loops: every pass it mirrors
#   - the gzip Postgres dumps from the db-backups volume  -> <bucket>/<prefix>/db/
#   - the product-photo bucket from the local MinIO       -> <bucket>/<prefix>/media/
# into any S3-compatible bucket (Hetzner Object Storage, Cloudflare R2, Backblaze B2…),
# prunes remote dumps older than BACKUP_OFFSITE_RETENTION_DAYS, and stamps
# /status/offsite-last-success so the monitor can alert when copies stop landing.
#
# Unconfigured (no BACKUP_S3_BUCKET) it logs a reminder each pass and does nothing.
#
# One pass by hand:  docker compose -f docker-compose.prod.yml exec backup-offsite sh /scripts/backup-offsite.sh --once
#
set -u

INTERVAL="${BACKUP_OFFSITE_INTERVAL_SECONDS:-86400}"
RETENTION_DAYS="${BACKUP_OFFSITE_RETENTION_DAYS:-30}"
PREFIX="${BACKUP_S3_PREFIX:-adikabuyer}"
MEDIA_BUCKET="${S3_BUCKET:-adikabuyer-media}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
STATUS_FILE="${BACKUP_STATUS_DIR:-/status}/offsite-last-success"

log() { echo "[offsite] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }

run_pass() {
  if [ -z "${BACKUP_S3_BUCKET:-}" ]; then
    log "BACKUP_S3_BUCKET not set — backups stay on this server only (see README > Backups)"
    return 0
  fi

  mc alias set local "http://minio:9000" "${MINIO_ROOT_USER:?}" "${MINIO_ROOT_PASSWORD:?}" >/dev/null \
    && mc alias set offsite "${BACKUP_S3_ENDPOINT:?BACKUP_S3_ENDPOINT must be set}" \
      "${BACKUP_S3_ACCESS_KEY:?BACKUP_S3_ACCESS_KEY must be set}" "${BACKUP_S3_SECRET_KEY:?BACKUP_S3_SECRET_KEY must be set}" >/dev/null \
    || { log "FAILED to configure S3 aliases"; return 1; }

  target="offsite/$BACKUP_S3_BUCKET/$PREFIX"
  status=0
  # --overwrite so a re-run replaces a half-uploaded object; no --remove, so a dump that
  # rotated out locally still survives remotely until the retention prune below
  mc mirror --quiet --overwrite "$BACKUP_DIR" "$target/db" || { log "FAILED to copy database dumps"; status=1; }
  mc mirror --quiet --overwrite "local/$MEDIA_BUCKET" "$target/media" || { log "FAILED to mirror product photos"; status=1; }
  mc rm --recursive --force --older-than "${RETENTION_DAYS}d" "$target/db" >/dev/null 2>&1 || true

  if [ "$status" -eq 0 ]; then
    mkdir -p "$(dirname "$STATUS_FILE")" && date +%s > "$STATUS_FILE"
    log "copied dumps and photos to $target (remote dumps kept ${RETENTION_DAYS}d)"
  fi
  return "$status"
}

if [ "${1:-}" = "--once" ]; then
  run_pass
  exit $?
fi

log "started: every ${INTERVAL}s"
while true; do
  run_pass || log "pass failed, retrying next interval"
  sleep "$INTERVAL"
done
