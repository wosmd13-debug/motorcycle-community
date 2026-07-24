#!/bin/sh
set -e

# VPS 볼륨(data/, uploads/)이 root 소유로 남아 있으면 nextjs(1001)가 JSON 저장 불가
# 컨테이너 시작마다 권한을 맞춘 뒤 nextjs 로 앱 실행
fix_dir() {
  dir="$1"
  if [ -d "$dir" ]; then
    chown -R nextjs:nodejs "$dir" 2>/dev/null || true
    chmod -R u+rwX,g+rwX "$dir" 2>/dev/null || true
    find "$dir" -type f -exec chmod 664 {} \; 2>/dev/null || true
  fi
}

# Backup dirs under public/ make Next.js crash with EACCES on scandir
rm -rf /app/public/uploads.bak.* /app/public/data.bak.* 2>/dev/null || true

fix_dir /app/data
fix_dir /app/public/uploads

exec su nextjs -s /bin/sh -c 'cd /app && exec node server.js'
