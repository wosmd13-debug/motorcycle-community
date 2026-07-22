#!/usr/bin/env bash
# 배포 시 VPS data/uploads 를 git reset 전후로 보호합니다.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

  echo "    data/uploads 배포 전 백업 완료"
}

persist_deploy_data_restore() {
  if [[ -z "${DEPLOY_DATA_BACKUP:-}" || ! -d "$DEPLOY_DATA_BACKUP" ]]; then
    echo "    data 복원: 백업 없음"
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

fix_gallery_seed_data() {
  local target="$ROOT_DIR/data/gallery.json"
  local snapshot="$ROOT_DIR/scripts/gallery.snapshot.json"

  if [[ ! -f "$snapshot" ]]; then
    echo "    gallery 스냅샷 없음 (건너뜀)"
    return 0
  fi

  if [[ ! -f "$target" ]] || grep -q '"id": "seed-1"' "$target" 2>/dev/null; then
    cp "$snapshot" "$target"
    echo "    gallery.json 샘플 데이터 → 운영 스냅샷으로 복원"
  fi
}
