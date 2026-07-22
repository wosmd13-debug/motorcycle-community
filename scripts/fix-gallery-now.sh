#!/usr/bin/env bash
# 갤러리 샘플(seed) 데이터를 운영 스냅샷으로 즉시 복원
set -euo pipefail
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
source scripts/persist-deploy-data.sh

fix_gallery_seed_data
mkdir -p data public/uploads
chown -R 1001:1001 data public/uploads
chmod -R u+rwX,g+rwX data public/uploads
find data -type f -exec chmod 664 {} \; 2>/dev/null || true

docker compose up -d --force-recreate

echo ""
echo "확인: https://byanra.com/api/version"
echo "  gallerySeed=false, galleryPosts=4 이어야 합니다."
