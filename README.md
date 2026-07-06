# 라이더모임 (motorcycle-community)

오토바이를 취미로 타는 사람들을 위한 Next.js 커뮤니티 사이트입니다.

## 주요 기능

- 홈: 커뮤니티 소개 및 인기 글/갤러리/날씨 미리보기
- 게시판: 라이딩 모집, 정비, 장비, 코스 정보
- 지도: 네이버 지도 API 연동, 추천 라이딩 코스 마커 표시
- 갤러리: 라이딩 인증샷 공유
- 날씨: 라이딩 전 날씨 확인 (날씨 API 연동 준비)

## 기술 스택

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 네이버 지도 API 설정 (지도 페이지)

1. [네이버 클라우드 플랫폼](https://console.ncloud.com/) 로그인
2. **AI·NAVER API → Application 등록**
3. **Maps** 서비스 선택 (Dynamic Map)
4. 발급된 **Client ID** 복사
5. **Web 서비스 URL** 등록
   - 개발용: `http://localhost` (포트 번호 없이 등록)
6. 프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=발급받은_Client_ID
```

7. 개발 서버 재시작:

```bash
npm run dev
```

8. `/map` 페이지에서 지도 확인

## 다음 단계 아이디어

- 회원가입 / 로그인
- 게시글 작성 / 댓글
- 네이버 지도 API 연동 (지도 페이지)
- 갤러리 이미지 업로드
- OpenWeatherMap 날씨 API 연동
- Supabase 또는 MongoDB 백엔드 연결

## 프로젝트 구조

```
src/
  app/          # 페이지 라우트
  components/   # 공통 UI 컴포넌트
  lib/          # 목업 데이터
```
