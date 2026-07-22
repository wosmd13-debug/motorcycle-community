#!/usr/bin/env bash
# Protect VPS user data (data/, uploads/) across git reset --hard deploys.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-/root/motorcycle-community-backups}"
DEPLOY_DATA_BACKUP=""

persist_deploy_data_backup() {
  DEPLOY_DATA_BACKUP="$(mktemp -d)"
  mkdir -p "$DEPLOY_DATA_BACKUP/data" "$DEPLOY_DATA_BACKUP/uploads"

  if [[ -d "$ROOT_DIR/data" ]]; then
    cp -a "$ROOT_DIR/data/." "$DEPLOY_DATA_BACKUP/data/"
  fi
  if [[ -d "$ROOT_DIR/public/uploads" ]]; then
    cp -a "$ROOT_DIR/public/uploads/." "$DEPLOY_DATA_BACKUP/uploads/"
  fi

  mkdir -p "$BACKUP_ROOT"
  local stamp
  stamp="$(date +%Y%m%d-%H%M%S)"
  cp -a "$DEPLOY_DATA_BACKUP" "$BACKUP_ROOT/$stamp"
  echo "    data 백업 저장: $BACKUP_ROOT/$stamp"

  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -r | tail -n +8 | xargs -r rm -rf
}

persist_deploy_data_restore() {
  if [[ -z "${DEPLOY_DATA_BACKUP:-}" || ! -d "$DEPLOY_DATA_BACKUP" ]]; then
    echo "    data 복원: 백업 없음 (건너뜀)"
    return 0
  fi

  mkdir -p "$ROOT_DIR/data" "$ROOT_DIR/public/uploads"

  if [[ -d "$DEPLOY_DATA_BACKUP/data" ]]; then
    cp -a "$DEPLOY_DATA_BACKUP/data/." "$ROOT_DIR/data/"
  fi
  if [[ -d "$DEPLOY_DATA_BACKUP/uploads" ]]; then
    cp -a "$DEPLOY_DATA_BACKUP/uploads/." "$ROOT_DIR/public/uploads/"
  fi

  rm -rf "$DEPLOY_DATA_BACKUP"
  DEPLOY_DATA_BACKUP=""
  echo "    data/uploads 복원 완료"
}

persist_deploy_data_merge_gallery() {
  local candidate target="$ROOT_DIR/data/gallery.json"
  [[ -f "$target" ]] || return 0

  for candidate in \
    "/root/motorcycle-community-old/data/gallery.json" \
    "$BACKUP_ROOT"/*/data/gallery.json \
    "$ROOT_DIR/backups"/*/data/gallery.json; do
    [[ -f "$candidate" ]] || continue
    if command -v node >/dev/null 2>&1; then
      node "$ROOT_DIR/scripts/merge-gallery-posts.mjs" "$candidate" "$target" || true
    fi
  done
}
