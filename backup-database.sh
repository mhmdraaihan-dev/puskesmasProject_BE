#!/usr/bin/env bash
# Backup the Postgres database running in the project's docker container.
# Reads connection info from .env, dumps via `docker exec ... pg_dump` (custom format),
# no host port / local pg_dump install required.
set -euo pipefail
cd "$(dirname "$0")"

set -a
source .env
set +a

CONTAINER="${POSTGRES_CONTAINER_NAME:-puskesmas-database}"
BACKUP_DIR="backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/${POSTGRES_DB}_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Container '$CONTAINER' is not running. Start it with: docker compose up -d" >&2
  exit 1
fi

echo "Backing up '$POSTGRES_DB' from container '$CONTAINER'..."
docker exec "$CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$OUT_FILE"

echo "Backup saved to $OUT_FILE"
