#!/usr/bin/env bash
#
# Local dev/testing helper. Run from the repo root.
#
#   scripts/local.sh up       full production-parity stack in Docker at https://localhost
#   scripts/local.sh down     stop the full stack, keep the data volumes
#   scripts/local.sh reset    stop the full stack and wipe all data volumes
#   scripts/local.sh smoke    run scripts/e2e-smoke.sh against the running stack
#   scripts/local.sh logs     tail logs of the full stack
#   scripts/local.sh infra    dev mode: just Postgres/RabbitMQ/MinIO/gateway in Docker
#                             (then run catalog-service / order-service / frontend on the host)
#   scripts/local.sh infra-down
#
set -euo pipefail
cd "$(dirname "$0")/.."

PROD="docker compose -f docker-compose.prod.yml"
DEV="docker compose"                       # docker-compose.yml
ENV_FILE=".env"
# devpassword bcrypt hash, $ escaped as $$ for compose interpolation
ADMIN_HASH='$$2a$$10$$9BguCDSXLntTaKP7osWD..AgeTJ5gZs69qeWqqgizXeppyOjuEgoO'

write_env_if_missing() {
  [ -f "$ENV_FILE" ] && return
  echo "Creating $ENV_FILE (local-only, git-ignored, throwaway secrets)"
  cat > "$ENV_FILE" <<EOF
DOMAIN=localhost
CORS_ALLOWED_ORIGIN=http://localhost:5173

POSTGRES_USER=adikabuyer
POSTGRES_PASSWORD=local-dev-postgres
POSTGRES_DB=adikabuyer

RABBITMQ_USER=adikabuyer
RABBITMQ_PASSWORD=local-dev-rabbit

MINIO_ROOT_USER=adikabuyer
MINIO_ROOT_PASSWORD=local-dev-minio-123
S3_BUCKET=adikabuyer-media
S3_PUBLIC_URL_BASE=http://localhost:9000/adikabuyer-media

APP_JWT_SECRET=local-dev-jwt-secret-not-for-any-real-use-000000000000000000
APP_SECURITY_ADMIN_USERNAME=admin
APP_SECURITY_ADMIN_PASSWORD_HASH=${ADMIN_HASH}

TELEGRAM_BOT_TOKEN=
TELEGRAM_REGISTRATION_PASSWORD=

CATALOG_SERVICE_JAVA_OPTS=-Xmx512m -Xms128m
ORDER_SERVICE_JAVA_OPTS=-Xmx512m -Xms128m
GATEWAY_JAVA_OPTS=-Xmx512m -Xms128m
EOF
}

case "${1:-}" in
  ""|-h|--help|help) sed -n '2,13p' "$0"; exit 0 ;;
  smoke) exec bash scripts/e2e-smoke.sh https://localhost admin devpassword ;;
esac

# docker-compose.prod.yml has `${VAR:?}` guards that are evaluated even by `down`, so
# every $PROD subcommand needs the env file present.
write_env_if_missing

case "$1" in
  up)
    $DEV down --remove-orphans 2>/dev/null || true   # release ports if dev infra is running
    $PROD --env-file "$ENV_FILE" up -d --build --wait --wait-timeout 360
    echo
    echo "  storefront : https://localhost        (self-signed cert; -k / accept the warning)"
    echo "  admin      : https://localhost/admin  login  admin / devpassword"
    echo "  api        : https://localhost/api/catalog/products"
    echo "  MinIO UI   : http://localhost:9001    (adikabuyer / local-dev-minio-123)"
    echo "  RabbitMQ UI: http://localhost:15672   (adikabuyer / local-dev-rabbit)"
    echo
    echo "  next: scripts/local.sh smoke"
    ;;
  down)
    $PROD --env-file "$ENV_FILE" down
    ;;
  reset)
    $PROD --env-file "$ENV_FILE" down -v
    ;;
  logs)
    $PROD --env-file "$ENV_FILE" logs -f --tail 100 "${@:2}"
    ;;
  infra)
    $PROD --env-file "$ENV_FILE" down --remove-orphans 2>/dev/null || true  # release ports if the full stack is running
    $DEV up -d --wait --wait-timeout 180
    echo
    echo "Infra + gateway are up. Now run the services on the host:"
    echo "  (1) cd catalog-service && mvn spring-boot:run"
    echo "  (2) cd order-service   && mvn spring-boot:run"
    echo "  (3) cd frontend        && npm install && npm run dev   ->  http://localhost:5173"
    echo
    echo "Login: admin / devpassword"
    ;;
  infra-down)
    $DEV down
    ;;
  *)
    echo "unknown command: $1" >&2
    sed -n '2,13p' "$0"
    exit 1
    ;;
esac
