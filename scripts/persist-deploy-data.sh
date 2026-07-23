#!/usr/bin/env bash
# 배포 시 VPS data/uploads 를 git reset 전후로 보호합니다.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DATA_BACKUP=""

gallery_is_seed_file() {
  local file="$1"
  [[ -f "$file" ]] && grep -q 'seed-1' "$file" 2>/dev/null
}

cafe_is_seed_file() {
  local file="$1"
  [[ -f "$file" ]] && grep -q 'seed-cafe-1' "$file" 2>/dev/null
}

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
    if gallery_is_seed_file "$DEPLOY_DATA_BACKUP/data/gallery.json"; then
      echo "    gallery 백업이 샘플 데이터 → gallery.json 복원 제외"
      while IFS= read -r -d '' entry; do
        base="$(basename "$entry")"
        [[ "$base" == "gallery.json" ]] && continue
        if [[ "$base" == "rider-cafes.json" ]] && cafe_is_seed_file "$entry"; then
          echo "    rider-cafes 백업이 샘플 데이터 → rider-cafes.json 복원 제외"
          continue
        fi
        cp -a "$entry" "$ROOT_DIR/data/"
      done < <(find "$DEPLOY_DATA_BACKUP/data" -mindepth 1 -maxdepth 1 -print0)
    else
      cp -a "$DEPLOY_DATA_BACKUP/data/." "$ROOT_DIR/data/"
    fi
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

  if [[ ! -f "$target" ]] || gallery_is_seed_file "$target"; then
    cp -f "$snapshot" "$target"
    chmod 664 "$target" 2>/dev/null || true
    echo "    gallery.json 샘플 데이터 → 운영 스냅샷으로 복원"
  fi
}

fix_cafe_seed_data() {
  local target="$ROOT_DIR/data/rider-cafes.json"
  local snapshot="$ROOT_DIR/scripts/rider-cafes.snapshot.json"

  if [[ ! -f "$snapshot" ]]; then
    echo "    rider-cafes 스냅샷 없음 (건너뜀)"
    return 0
  fi

  if [[ ! -f "$target" ]] || cafe_is_seed_file "$target"; then
    cp -f "$snapshot" "$target"
    chmod 664 "$target" 2>/dev/null || true
    echo "    rider-cafes.json 샘플 데이터 → 운영 스냅샷으로 복원"
  fi
}
