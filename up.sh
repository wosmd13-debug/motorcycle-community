#!/usr/bin/env bash
# 서버 배포 — 프로젝트 폴더에서: bash up.sh
set -e
cd "$(dirname "$0")"

echo "==> 0/4 data 폴더 권한"
mkdir -p data public/uploads
chown -R 1001:1001 data public/uploads 2>/dev/null || true

echo "==> 1/4 GitHub 최신 코드"
git remote update
git reset --hard origin/main
export APP_COMMIT="$(git rev-parse --short HEAD)"
echo "    commit: $APP_COMMIT"

echo "==> 2/4 Docker 재빌드"
docker compose up -d --build

echo "==> 3/4 컨테이너 상태"
docker compose ps

echo "==> 4/4 배포 확인"
echo "    모바일/PC 브라우저에서 아래 주소를 열어 commit 값을 확인하세요:"
echo "    https://byanra.com/api/version"
git log -1 --oneline
echo ""
echo "완료."
