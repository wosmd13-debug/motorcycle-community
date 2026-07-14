# 배포 가이드 (단일 VPS)

이 프로젝트는 **JSON 파일 + 로컬 업로드** 저장 방식입니다.
따라서 **Vercel 같은 서버리스가 아니라, 디스크가 유지되는 VPS 1대**에 배포하세요.
프로세스는 **1개만** 실행해야 데이터가 덮어쓰기로 깨지지 않습니다.

기존 기능(게시판·갤러리·상점·미션·지도 등)은 그대로 동작합니다.
모바일에서도 네비·모달·좋아요/투표·로그인이 동작하도록 맞춰 두었습니다.

**코드 쪽 배포 준비는 완료**되었습니다. 남은 일은 도메인·VPS 구매와 서버 설치뿐입니다.

---

## 0. 도메인·호스팅 구매 체크리스트 (구매 전)

### 도메인
- [ ] 원하는 도메인 확보
- [ ] DNS 관리 권한 확인

### VPS (권장)
- [ ] Ubuntu 22.04 LTS
- [ ] RAM 2GB 이상 (4GB 권장)
- [ ] SSD 40GB 이상
- [ ] SSH 접속 가능

### 피해야 할 것
- [ ] Vercel/Netlify 등 서버리스만 쓰는 플랜
- [ ] FTP만 되는 저가 공유 호스팅

구매 후 → 아래 1번부터 진행.

---

## 코드에 이미 반영된 준비 사항

- Docker / standalone 빌드, data·uploads 볼륨
- 업로드·좋아요·댓글투표·글쓰기·신고 rate limit
- SSR에서 likedBy/votesBy 비노출, AUTH_SECRET 취약값 차단
- robots.txt / sitemap / Open Graph 메타데이터
- 이미지 매직바이트 검증, 삭제 시 업로드 파일 정리
- 게시판·영상 작성자 본인 수정/삭제
- 백업 스크립트, 진단 API production 차단
- 개인정보방침·비밀번호 정책 정리

---

## 1. 서버 준비

Ubuntu + Docker 또는 Node 20+. DNS A레코드 → 서버 IP. 방화벽 80/443.

앞단에 **Nginx/Caddy**로 HTTPS를 연결하고, `X-Forwarded-For`는 프록시에서만 신뢰하세요.
(앱을 3000 포트로 직접 공개하면 rate limit IP가 위조될 수 있습니다.)

---

## 2. 환경 변수

`.env.example` → `.env.production` 복사 후 반드시 설정:

| 변수 | 설명 |
|------|------|
| `AUTH_SECRET` | **32자 이상** 랜덤 문자열 (예시/개발용 값 금지) |
| `ADMIN_LOGIN_IDS` | 운영자 로그인 ID (쉼표 구분) |
| `NEXT_PUBLIC_SITE_URL` | `https://실제도메인` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 문의 메일 |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 등 | 지도·날씨·유가 키 |

`NEXT_PUBLIC_*` 는 **이미지 빌드 시** 들어가므로, 값을 바꾼 뒤에는 `docker compose up -d --build`로 다시 빌드하세요.

---

## 3. Docker 실행

```bash
cp .env.example .env.production
# .env.production 내용을 실제 값으로 수정

mkdir -p data public/uploads
sudo chown -R 1001:1001 data public/uploads

docker compose up -d --build
```

앞단에 Nginx/Caddy로 HTTPS 연결.

볼륨 권한(`1001:1001`)을 맞추지 않으면 회원가입·업로드·글쓰기가 500으로 실패할 수 있습니다.

---

## 4. 백업

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

cron으로 매일 실행 권장.

---

## 5. 오픈 전 스모크 (PC + 모바일)

1. 목록/상세 로딩
2. 회원가입(영문+숫자 8자+)·로그인
3. 글쓰기·업로드·본인 수정/삭제
4. 좋아요·댓글·투표
5. 미션·상점
6. 모바일 메뉴·모달
7. `/robots.txt`, `/sitemap.xml` 응답 확인

---

## 6. 트래픽 증가 시

Postgres + 오브젝트 스토리지로 이전을 검토하세요.
