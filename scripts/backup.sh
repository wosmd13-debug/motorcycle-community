#!/usr/bin/env bash
# data/ + public/uploads 백업 (단일 VPS용)
# 예: crontab -e → 0 3 * * * /path/to/app/scripts/backup.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-$ROOT_DIR/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_ROOT/$STAMP"

mkdir -p "$DEST"
mkdir -p "$ROOT_DIR/data" "$ROOT_DIR/public/uploads"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$ROOT_DIR/data/" "$DEST/data/"
  rsync -a --delete "$ROOT_DIR/public/uploads/" "$DEST/uploads/"
else
  cp -a "$ROOT_DIR/data" "$DEST/data"
  cp -a "$ROOT_DIR/public/uploads" "$DEST/uploads"
fi

# 최근 14일치만 유지
if command -v find >/dev/null 2>&1; then
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
fi

echo "Backup saved: $DEST"
