#!/usr/bin/env bash
# VPS에서 코드 변경(갤러리 UI, 기능 추가 등) 반영 시 실행
# 사용: ./scripts/deploy-update.sh
#
# 사전 조건:
# - 프로젝트 루트에 .env.production 존재
# - data/ public/uploads 볼륨 유지 (삭제 금지)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> 배포 업데이트 시작: $ROOT_DIR"

if [[ ! -f .env.production ]]; then
  echo "오류: .env.production 파일이 없습니다."
  echo "  cp .env.example .env.production 후 실제 값을 입력하세요."
  exit 1
fi

if ! grep -q '^NEXT_PUBLIC_SITE_URL=https://' .env.production 2>/dev/null; then
  echo "경고: NEXT_PUBLIC_SITE_URL이 https:// 실제 도메인으로 설정됐는지 확인하세요."
fi

mkdir -p data public/uploads

if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "==> git remote update && git reset --hard origin/main"
  # shellcheck disable=SC1091
  source scripts/persist-deploy-data.sh
  persist_deploy_data_backup
  git remote update
  git reset --hard origin/main
  persist_deploy_data_restore
  persist_deploy_data_merge_gallery
fi

echo "==> docker compose build & restart"
docker compose --env-file .env.production up -d --build

echo "==> 컨테이너 상태"
docker compose ps

echo ""
echo "완료. 브라우저에서 아래를 확인하세요:"
echo "  - https://YOUR_DOMAIN/gallery  (모바일 제목 표시)"
echo "  - https://YOUR_DOMAIN/sitemap.xml"
echo "  - https://YOUR_DOMAIN/robots.txt"
echo ""
echo "로그: docker compose logs -f --tail=100 web"
