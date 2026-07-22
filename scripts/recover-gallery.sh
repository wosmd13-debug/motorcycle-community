#!/usr/bin/env bash
# 갤러리 글 복구 — 배포 중 data/gallery.json 이 덮어써진 경우 실행
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 갤러리 백업에서 누락 글 병합"
# shellcheck disable=SC1091
source scripts/persist-deploy-data.sh
persist_deploy_data_merge_gallery

echo "==> 권한 정리"
mkdir -p data public/uploads
chown -R 1001:1001 data public/uploads 2>/dev/null || true
chmod -R u+rwX,g+rwX data public/uploads 2>/dev/null || true

echo "==> 컨테이너 재시작"
docker compose up -d --force-recreate

echo ""
echo "완료. 확인: https://byanra.com/api/gallery"
