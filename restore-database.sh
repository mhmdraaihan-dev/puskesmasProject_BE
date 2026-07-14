#!/usr/bin/env bash
# Restore a backup produced by backup-database.sh into the project's docker container.
# Usage: ./restore-database.sh [backup_file] [target_db]
#   backup_file defaults to the newest file in ./backups
#   target_db   defaults to POSTGRES_DB from .env (existing data is dropped/replaced)
set -euo pipefail
cd "$(dirname "$0")"

set -a
source .env
set +a

CONTAINER="${POSTGRES_CONTAINER_NAME:-puskesmas-database}"
BACKUP_FILE="${1:-$(ls -t backups/*.dump 2>/dev/null | head -n1)}"
TARGET_DB="${2:-$POSTGRES_DB}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "No backup file found. Usage: ./restore-database.sh [backup_file] [target_db]" >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Container '$CONTAINER' is not running. Start it with: docker compose up -d" >&2
  exit 1
fi

echo "Restoring $BACKUP_FILE into database '$TARGET_DB' on container '$CONTAINER'..."
docker exec -i "$CONTAINER" psql -U "$POSTGRES_USER" -d postgres \
  -c "SELECT 1 FROM pg_database WHERE datname = '$TARGET_DB'" | grep -q 1 \
  || docker exec "$CONTAINER" createdb -U "$POSTGRES_USER" "$TARGET_DB"

docker exec -i "$CONTAINER" pg_restore -U "$POSTGRES_USER" -d "$TARGET_DB" --clean --if-exists < "$BACKUP_FILE"

echo "Restore complete into '$TARGET_DB'."
