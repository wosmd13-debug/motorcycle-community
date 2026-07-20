# 배포용 파일만 deploy-pack/ 폴더에 모읍니다.
# 사용 (PowerShell, 프로젝트 루트에서):
#   .\scripts\pack-for-deploy.ps1
#
# WinSCP: deploy-pack 폴더 내용 전체 → 서버 /var/www/html 로 업로드

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $Root "deploy-pack"
$ZipPath = Join-Path $Root "deploy-pack.zip"

Write-Host "==> 배포 패키지 만들기" -ForegroundColor Cyan
Write-Host "    프로젝트: $Root"

if (-not (Test-Path (Join-Path $Root ".env.production"))) {
    Write-Host ""
    Write-Host "경고: .env.production 이 없습니다." -ForegroundColor Yellow
    Write-Host "  .env.example 을 복사해 .env.production 을 만든 뒤 다시 실행하세요."
    Write-Host ""
}

# 이전 패키지 삭제
if (Test-Path $OutDir) {
    Remove-Item $OutDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

# 복사할 파일 (루트)
$RootFiles = @(
    "docker-compose.yml",
    "Dockerfile",
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
    "eslint.config.mjs",
    ".env.production"
)

foreach ($file in $RootFiles) {
    $src = Join-Path $Root $file
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $OutDir $file) -Force
        Write-Host "  + $file"
    } elseif ($file -eq ".env.production") {
        Write-Host "  ! $file (없음 — 건너뜀)" -ForegroundColor Yellow
    }
}

# 복사할 폴더
$Dirs = @("src", "scripts", "public")

foreach ($dir in $Dirs) {
    $srcDir = Join-Path $Root $dir
    if (-not (Test-Path $srcDir)) { continue }

    $destDir = Join-Path $OutDir $dir
    Write-Host "  + $dir/ ..."

    if ($dir -eq "public") {
        # public/uploads 사용자 파일 제외, 폴더 구조만
        robocopy $srcDir $destDir /E /XD uploads node_modules .next /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
        $uploadsKeep = Join-Path $destDir "uploads"
        if (-not (Test-Path $uploadsKeep)) {
            New-Item -ItemType Directory -Path $uploadsKeep -Force | Out-Null
        }
        $gitkeep = Join-Path $uploadsKeep ".gitkeep"
        if (-not (Test-Path $gitkeep)) {
            New-Item -ItemType File -Path $gitkeep -Force | Out-Null
        }
    } else {
        robocopy $srcDir $destDir /E /XD node_modules .next /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    }
}

# data 폴더 빈 구조만 (서버 런타임용)
$dataDir = Join-Path $OutDir "data"
New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
$srcKeep = Join-Path $Root "data\.gitkeep"
if (Test-Path $srcKeep) {
    Copy-Item $srcKeep (Join-Path $dataDir ".gitkeep") -Force
}

# ZIP 생성
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}
Compress-Archive -Path (Join-Path $OutDir "*") -DestinationPath $ZipPath -Force

Write-Host ""
Write-Host "완료!" -ForegroundColor Green
Write-Host ""
Write-Host "  폴더: $OutDir"
Write-Host "  ZIP:  $ZipPath"
Write-Host ""
Write-Host "WinSCP 업로드 방법:" -ForegroundColor Cyan
Write-Host "  1. 왼쪽에서 deploy-pack 폴더 열기"
Write-Host "  2. 안의 파일/폴더 전체 선택"
Write-Host "  3. 오른쪽 /var/www/html 로 드래그"
Write-Host ""
Write-Host "또는 ZIP만 올린 뒤 서버 터미널:" -ForegroundColor Cyan
Write-Host "  cd /var/www/html"
Write-Host "  unzip -o deploy-pack.zip"
Write-Host "  docker compose up -d --build"
Write-Host ""
