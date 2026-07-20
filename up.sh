#!/usr/bin/env bash
# 서버 배포 — 프로젝트 폴더에서: bash up.sh
set -e
cd "$(dirname "$0")"

echo "==> 1/3 GitHub 최신 코드 받기"
git remote update
git reset --hard origin/main

echo "==> 2/3 Docker 재빌드"
docker compose up -d --build

echo "==> 3/3 현재 버전"
git log -1 --oneline
docker compose ps
echo ""
echo "완료. 브라우저에서 사이트를 새로고침해 확인하세요."
