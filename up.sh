#!/usr/bin/env bash
# 서버 배포 — 프로젝트 폴더에서: bash up.sh
set -e
cd "$(dirname "$0")"

if [[ ! -f .env.production ]]; then
  echo "오류: .env.production 파일이 없습니다."
  echo "  cp .env.production.example .env.production 후 값을 입력하세요."
  exit 1
fi

echo "==> 0/5 설정 확인"
# Docker build-arg는 .env.production 을 직접 읽지 않으므로 export 필요
set -a
# shellcheck disable=SC1091
source .env.production
set +a

if [[ "${NEXT_PUBLIC_SITE_URL:-}" != https://* ]]; then
  echo "오류: .env.production 의 NEXT_PUBLIC_SITE_URL 이 https:// 실제 도메인이 아닙니다."
  echo "  현재 값: ${NEXT_PUBLIC_SITE_URL:-비어 있음}"
  echo "  예: NEXT_PUBLIC_SITE_URL=https://byanra.com"
  exit 1
fi
echo "    SITE_URL=$NEXT_PUBLIC_SITE_URL"

echo "==> 1/5 data 폴더 권한"
mkdir -p data public/uploads
chown -R 1001:1001 data public/uploads 2>/dev/null || true

echo "==> 2/5 GitHub 최신 코드"
git remote update
git reset --hard origin/main
export APP_COMMIT="$(git rev-parse --short HEAD)"
echo "    commit: $APP_COMMIT"

echo "==> 3/5 Docker 재빌드 (.env.production 값 반영)"
docker compose up -d --build

echo "==> 4/5 컨테이너 상태"
docker compose ps

echo "==> 5/5 배포 확인"
echo "    모바일/PC에서 열기: https://byanra.com/api/version"
echo "    commit=$APP_COMMIT, site=$NEXT_PUBLIC_SITE_URL 이어야 합니다."
git log -1 --oneline
echo ""
echo "완료."
