# 배포 가이드 — 가비아 + WinSCP (byanra.com)

이 문서는 **가비아**에서 도메인·호스팅을 쓰고, **WinSCP**로 파일을 올려 배포하는 방식 기준으로 작성했습니다.  
예시 도메인: `byanra.com` (본인 도메인으로 바꿔서 진행)

---

## 사용 환경 (본 프로젝트 기준)

| 항목 | 사용 |
|------|------|
| 도메인·호스팅 | **가비아** |
| 파일 업로드 | **WinSCP** (SFTP) |
| 서버 명령 실행 | WinSCP 내장 터미널 또는 PuTTY |
| 배포 방식 | Docker (`docker compose`) |

> **호스팅 종류 확인:** 이 사이트는 **Docker가 실행되는 서버**(가비아 가상서버/VPS, SSH 접속 가능)가 필요합니다.  
> 가비아 **일반 웹호스팅**(PHP 전용, SSH/Docker 불가)만 있으면 이 방식으로는 배포할 수 없습니다.

---

## 한눈에 보는 전체 순서

```
1. 가비아에서 서버 IP·SSH 계정 확인
2. 가비아 DNS 설정 (도메인 → 서버 IP)
3. WinSCP로 서버 접속
4. 서버에 Docker 설치 (최초 1회)
5. WinSCP로 프로젝트 폴더 업로드
6. .env.production 설정
7. docker compose up -d --build
8. 가비아 또는 Caddy로 HTTPS 연결
9. API 키·네이버 지도 URL 등록
10. 브라우저에서 최종 확인
```

---

## 1단계 — 가비아에서 필요한 정보 확인

[가비아 MyGabia](https://www.gabia.com/) 로그인 후 아래를 메모해 두세요.

### 도메인 (이미 보유: byanra.com)

- **My가비아 → 서비스 관리 → 도메인** 에서 `byanra.com` 확인

### 서버 (가상서버 / VPS)

- **My가비아 → 서비스 관리 → 호스팅** (또는 가상서버)
- 아래 4가지를 꼭 적어 두세요:

```
서버 IP:        예) 123.45.67.89
SSH 포트:       보통 22
SSH 아이디:     예) root
SSH 비밀번호:   (가비아에서 설정한 값)
```

SSH 접속 정보는 가비아 호스팅 관리 페이지 **「서버 접속 정보」** 또는 **「SSH 접속」** 메뉴에 있습니다.

---

## 2단계 — 가비아 DNS 설정 (도메인 → 서버 IP)

도메인이 서버 IP를 가리키도록 연결합니다.

### 설정 경로

1. [My가비아](https://www.gabia.com/) 로그인
2. **서비스 관리 → 도메인 → byanra.com**
3. **DNS 관리** (또는 **네임서버/DNS 설정**)
4. **레코드 추가** 또는 **DNS 설정**

### 추가할 레코드

| 타입 | 호스트 | 값/위치 | TTL |
|------|--------|---------|-----|
| A | `@` | `123.45.67.89` (본인 서버 IP) | 600 |
| A | `www` | `123.45.67.89` (같은 IP) | 600 |

- `@` → `byanra.com`
- `www` → `www.byanra.com`

### 가비아 화면별 입력 팁

| 가비아 화면 표현 | 의미 |
|-----------------|------|
| 호스트 `@` 또는 비움 | 루트 도메인 (`byanra.com`) |
| 호스트 `www` | `www.byanra.com` |
| 값 / IP / 위치 | VPS IP 주소 |

**반영 시간:** 10분~2시간 (가끔 24시간). 보통 30분 이내.

### 연결 확인 (Windows)

PowerShell 또는 CMD:

```powershell
nslookup byanra.com
```

나온 IP가 가비아 VPS IP와 같으면 OK.

---

## 3단계 — WinSCP 설치 및 서버 접속

### WinSCP 다운로드

- https://winscp.net/eng/download.php
- Windows PC에 설치

### 새 세션 만들기

WinSCP 실행 → **새 세션**:

| 항목 | 입력값 |
|------|--------|
| 파일 프로토콜 | **SFTP** |
| 호스트 이름 | 가비아 VPS IP (예: `123.45.67.89`) |
| 포트 번호 | `22` (가비아에서 다른 포트면 그 값) |
| 사용자 이름 | SSH 아이디 (예: `root`) |
| 비밀번호 | SSH 비밀번호 |

**저장** → **로그인**

- 처음 접속: 「서버 호스트 키」 → **예**
- 비밀번호 저장 여부: 편의상 **예** (본인 PC만 사용할 때)

### 접속이 안 될 때

- 가비아 호스팅 관리에서 **SSH 사용** 이 켜져 있는지 확인
- 가비아 **방화벽**에서 22번 포트 허용 확인
- IP·아이디·비밀번호 다시 확인

---

## 4단계 — 서버에 Docker 설치 (최초 1회)

WinSCP 상단 메뉴 **명령 → 터미널 열기** (또는 `Ctrl+T`) → 아래를 **한 줄씩** 붙여넣기:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
docker --version
docker compose version
```

버전 번호가 나오면 설치 완료.

---

## 5단계 — WinSCP로 프로젝트 업로드

### 서버에 폴더 만들기

WinSCP 터미널에서:

```bash
sudo mkdir -p /var/www/byanra
sudo chown $USER:$USER /var/www/byanra
```

### WinSCP 화면 구성

- **왼쪽:** 내 PC — `motorcycle-community` 프로젝트 폴더
- **오른쪽:** 서버 — `/var/www/byanra`

### 업로드 방법

1. 왼쪽에서 프로젝트 **전체** 선택
2. 오른쪽 `/var/www/byanra` 로 **드래그 앤 드롭**
3. 「복사」 확인

### 올리지 않아도 되는 폴더 (용량·시간 절약)

업로드 제외해도 됩니다 (서버에서 Docker가 새로 빌드함):

- `node_modules`
- `.next`

WinSCP 전송 설정에서 제외하려면:  
**옵션 → 환경설정 → 전송 → 제외 목록**에 `node_modules; .next` 추가

### 반드시 올려야 하는 것

- `src/`, `public/`, `scripts/`
- `package.json`, `package-lock.json`
- `Dockerfile`, `docker-compose.yml`
- `.env.production` ← **아래 6단계에서 PC에서 만들어서 함께 업로드**

---

## 6단계 — `.env.production` 설정

### PC(Cursor)에서 파일 만들기

프로젝트 루트에 `.env.production` 파일 (이미 있으면 수정):

```env
AUTH_SECRET=32자_이상_긴_랜덤_문자열
ADMIN_LOGIN_IDS=wosmd13
NEXT_PUBLIC_SITE_OPERATOR_NAME=바이크커뮤니티 운영팀
NEXT_PUBLIC_CONTACT_EMAIL=wosmd13@naver.com
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_SITE_URL=https://byanra.com
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은_Client_ID
NAVER_MAP_CLIENT_SECRET=발급받은_Secret
NEXT_PUBLIC_USE_NAVER_MAP=true
OPENWEATHERMAP_API_KEY=발급받은_OpenWeatherMap_키
OPINET_API_KEY=발급받은_OPINET_키
```

**주의:**

- `NEXT_PUBLIC_SITE_URL` 끝에 `/` 붙이지 않기 → `https://byanra.com` ✅
- `AUTH_SECRET`은 개발용 값(`dev-local-...`) 쓰지 말 것

### WinSCP로 업로드

- PC의 `.env.production` → 서버 `/var/www/byanra/.env.production`

WinSCP에서 `.`으로 시작하는 파일이 안 보이면:  
**옵션 → 환경설정 → 패널** → 「숨김 파일 표시」 체크

---

## 7단계 — Docker로 사이트 실행 (첫 배포)

WinSCP 터미널:

```bash
cd /var/www/byanra
mkdir -p data public/uploads
sudo chown -R 1001:1001 data public/uploads
docker compose up -d --build
```

- **처음 빌드:** 5~15분 걸릴 수 있음
- 끝나면 컨테이너 상태 확인:

```bash
docker compose ps
```

`web` 이 **running** 이면 성공.

### 1차 접속 테스트

브라우저:

```
http://123.45.67.89:3000
```

(VPS IP — HTTPS 적용 전)

### 오류 확인

```bash
docker compose logs --tail=100 web
```

---

## 8단계 — HTTPS (https://byanra.com)

### 방법 A — Caddy (추천, 무료 SSL 자동)

WinSCP 터미널:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
sudo nano /etc/caddy/Caddyfile
```

아래 내용 입력:

```
byanra.com, www.byanra.com {
    reverse_proxy localhost:3000
}
```

저장: `Ctrl+O` → Enter → `Ctrl+X`

```bash
sudo systemctl reload caddy
```

### 방법 B — 가비아 SSL (가비아에서 SSL 상품 사용 시)

가비아 호스팅 관리의 SSL/인증서 메뉴 안내에 따라 설정.  
리버스 프록시는 **3000번 포트**로 연결.

### HTTPS 확인

```
https://byanra.com
```

---

## 9단계 — API 키 등록

### 네이버 지도

1. [네이버 클라우드 콘솔](https://console.ncloud.com)
2. Maps Application → **Web 서비스 URL** 추가:
   - `https://byanra.com`
   - `https://www.byanra.com`
3. Client ID를 `.env.production`에 반영
4. **WinSCP**로 수정된 `.env.production` 다시 업로드
5. 터미널:

```bash
cd /var/www/byanra
docker compose up -d --build
```

### OpenWeatherMap (날씨)

1. [openweathermap.org](https://openweathermap.org/api) 에서 키 발급
2. `.env.production`에 `OPENWEATHERMAP_API_KEY=키값`
3. WinSCP로 업로드 후:

```bash
cd /var/www/byanra
docker compose up -d
```

(날씨 키만 바꿨을 때는 `--build` 없이 재시작만 해도 됨)

---

## 10단계 — 최종 확인 (PC + 휴대폰)

| 확인 | URL |
|------|-----|
| 홈 | https://byanra.com |
| 날씨 | https://byanra.com/weather |
| 지도 | https://byanra.com/map |
| 회원가입 | https://byanra.com/register |
| sitemap | https://byanra.com/sitemap.xml |

sitemap에 `byanra.com` 주소가 나와야 하고, `localhost`가 나오면 안 됩니다.

---

## ★ 코드 수정 후 다시 배포 (WinSCP 일상 작업)

로컬(Cursor)에서 코드를 고친 뒤 **매번 이 순서**로 진행하세요.

### 1) 로컬에서 빌드 확인

```bash
npm run build
```

오류 없으면 다음 단계.

### 2) WinSCP로 변경 파일 업로드

| 상황 | 업로드 대상 |
|------|------------|
| 페이지·기능 수정 | 변경된 `src/` 파일 등 |
| 설정 변경 | `.env.production` |
| 패키지 추가 | `package.json`, `package-lock.json` 전체 |

- **왼쪽(PC)** → **오른쪽(서버 `/var/www/byanra`)** 드래그로 **덮어쓰기**
- `node_modules`, `.next`는 **올리지 않음**

### 3) 서버에서 Docker 재실행

WinSCP 터미널:

```bash
cd /var/www/byanra
docker compose up -d --build
```

### 4) 브라우저에서 확인

- `Ctrl + F5` (강력 새로고침)
- 문제 있으면: `docker compose logs --tail=50 web`

### 재빌드 vs 재시작만

| 변경 내용 | 명령 |
|----------|------|
| 소스 코드 (`src/` 등) | `docker compose up -d --build` |
| `NEXT_PUBLIC_*` (도메인, 지도 Client ID 등) | `docker compose up -d --build` |
| `OPENWEATHERMAP_API_KEY`만 | `docker compose up -d` |

---

## WinSCP 자주 쓰는 팁

### 숨김 파일 보기 (`.env.production`)

**옵션 → 환경설정 → 패널** → 「숨김 파일 표시」

### 터미널 열기

**명령 → 터미널 열기** (단축키 `Ctrl+T`)

### 동기화 (폴더 전체 맞추기)

**명령 → 동기화** — PC와 서버 차이만 업로드 (고급, 익숙해지면 사용)

### 백업 후 업데이트 (권장)

배포 전 WinSCP 터미널:

```bash
cd /var/www/byanra
chmod +x scripts/backup.sh
./scripts/backup.sh
```

---

## 자주 하는 실수 (가비아 + WinSCP)

### 1. DNS가 아직 안 붙음

- 가비아 DNS 설정 후 **30분~2시간** 기다리기
- `nslookup byanra.com` 으로 IP 확인

### 2. `.env.production`을 안 올림

- WinSCP에서 숨김 파일 표시 켜기
- 서버 `/var/www/byanra/.env.production` 존재 확인

### 3. `node_modules`를 통째로 업로드

- **하지 마세요** — 매우 느리고 오류 원인
- 서버에서 `docker compose up -d --build` 가 알아서 설치

### 4. 업로드·회원가입 500 오류

```bash
cd /var/www/byanra
sudo chown -R 1001:1001 data public/uploads
docker compose restart
```

### 5. `data/`, `public/uploads/` 삭제

- **절대 삭제 금지** — 게시글·회원·사진 전부 사라짐

### 6. 날씨 "API 키 필요" 메시지

- `.env.production`에 `OPENWEATHERMAP_API_KEY` 확인
- WinSCP로 다시 업로드 → `docker compose up -d`

---

## 최소 명령 치트시트 (WinSCP 터미널)

```bash
# 프로젝트 폴더로 이동
cd /var/www/byanra

# 배포 (코드 올린 후)
docker compose up -d --build

# 상태 확인
docker compose ps

# 오류 로그
docker compose logs --tail=100 web

# 재시작
docker compose restart

# 백업
./scripts/backup.sh
```

---

## 요약 — 처음 한 번만

1. 가비아 DNS: A레코드 `@`, `www` → VPS IP  
2. WinSCP 접속 (SFTP, IP, SSH 아이디/비밀번호)  
3. 프로젝트 → `/var/www/byanra` 업로드 (`node_modules` 제외)  
4. `.env.production` 업로드  
5. 터미널: `docker compose up -d --build`  
6. Caddy로 HTTPS  
7. `https://byanra.com` 접속 확인  

## 요약 — 코드 수정할 때마다

1. 로컬 `npm run build` 확인  
2. WinSCP로 변경 파일 덮어쓰기  
3. 터미널: `docker compose up -d --build`  
4. 브라우저 `Ctrl+F5`  

---

더 자세한 API 발급 방법은 `README.md`, `.env.example` 을 참고하세요.
