#!/usr/bin/env bash
# 서버 배포 — 프로젝트 폴더에서: bash up.sh
set -e
cd "$(dirname "$0")"

echo "==> 0/5 설정 확인"
if [[ ! -f .env.production ]]; then
  if [[ -f /root/motorcycle-community-old/.env.production ]]; then
    cp /root/motorcycle-community-old/.env.production .env.production
    echo "    .env.production 복사 완료 (old 폴더)"
  else
    echo "오류: .env.production 파일이 없습니다."
    exit 1
  fi
fi

# localhost 로 되어 있으면 자동 수정 (수동 sed/grep 오타 방지)
if grep -q '^NEXT_PUBLIC_SITE_URL=http://localhost' .env.production 2>/dev/null \
  || ! grep -q '^NEXT_PUBLIC_SITE_URL=https://' .env.production 2>/dev/null; then
  echo "    NEXT_PUBLIC_SITE_URL 자동 수정 → https://byanra.com"
  if grep -q '^NEXT_PUBLIC_SITE_URL=' .env.production; then
    sed -i 's|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://byanra.com|' .env.production
  else
    echo 'NEXT_PUBLIC_SITE_URL=https://byanra.com' >> .env.production
  fi
fi

# 배포 시 항상 실제 도메인 사용 (Docker build/runtime 공통)
export NEXT_PUBLIC_SITE_URL="https://byanra.com"

if [[ "${NEXT_PUBLIC_SITE_URL:-}" != https://* ]]; then
  echo "오류: NEXT_PUBLIC_SITE_URL 설정 실패"
  echo "  현재 값: ${NEXT_PUBLIC_SITE_URL:-비어 있음}"
  exit 1
fi
echo "    SITE_URL=$NEXT_PUBLIC_SITE_URL"

# AUTH_SECRET 등 나머지 운영 설정 로드
set -a
# shellcheck disable=SC1091
source .env.production
set +a
export NEXT_PUBLIC_SITE_URL="https://byanra.com"

echo "==> 1/5 data 폴더 권한"
mkdir -p data public/uploads
chown -R 1001:1001 data public/uploads
chmod -R u+rwX,g+rwX data public/uploads

echo "==> 2/5 GitHub 최신 코드"
git remote update
git reset --hard origin/main
export APP_COMMIT="$(git rev-parse --short HEAD)"
echo "    commit: $APP_COMMIT"

echo "==> 3/5 Docker 재빌드 (.env.production 값 반영)"
docker compose up -d --build

echo "==> 4/5 컨테이너 상태"
docker compose ps

if docker compose exec -T web su nextjs -s /bin/sh -c 'if [ -f /app/data/gallery.json ]; then test -w /app/data/gallery.json; else test -w /app/data; fi'; then
  echo "    gallery.json 쓰기 테스트: OK"
else
  echo "    gallery.json 쓰기 테스트: 실패 — 권한 재설정 후 컨테이너 재시작"
  chown -R 1001:1001 data public/uploads
  find data -type f -exec chmod 664 {} \; 2>/dev/null || true
  docker compose up -d --force-recreate
fi

echo "==> 5/5 배포 확인"
echo "    모바일/PC에서 열기: https://byanra.com/api/version"
echo "    commit=$APP_COMMIT, site=$NEXT_PUBLIC_SITE_URL 이어야 합니다."
git log -1 --oneline
echo ""
echo "완료."
