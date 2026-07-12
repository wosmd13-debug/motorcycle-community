"use client";

import { NAVER_MAP_CLIENT_ID, USE_NAVER_MAP } from "@/lib/map-config";

export default function NaverMapSetupGuide() {
  if (!USE_NAVER_MAP) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-bold">네이버 지도 Client ID가 필요합니다</p>
        <p className="mt-2 leading-6 text-amber-900">
          <code className="rounded bg-white px-1">.env.local</code>에{" "}
          <code className="rounded bg-white px-1">
            NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
          </code>
          와 <code className="rounded bg-white px-1">NAVER_MAP_CLIENT_SECRET</code>
          을 설정한 뒤 개발 서버를 재시작하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p className="font-bold">네이버 지도 인증 설정이 필요합니다</p>
      <p className="mt-2 leading-6 text-amber-900">
        경로 API(Directions)는 동작해도 <strong>브라우저 지도 타일</strong>은 Web
        서비스 URL과 Dynamic Map 설정이 맞아야 표시됩니다. SDK는{" "}
        <code className="rounded bg-white px-1">ncpKeyId</code> 파라미터를
        사용합니다.
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-6 text-amber-900">
        <li>
          <a
            href="https://console.ncloud.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-signature-dark underline"
          >
            네이버 클라우드 콘솔
          </a>
          {" → Application Services → Maps → Application"}
        </li>
        <li>
          <strong>API 선택</strong> → <strong>Dynamic Map(Web)</strong> 체크 후
          저장
        </li>
        <li>
          <strong>Application 등록</strong> → <strong>Web 서비스 URL</strong>에
          아래를 등록 (공식 가이드: 포트·경로 없이 호스트만):
          <ul className="mt-1 list-disc pl-5">
            <li>
              <code className="rounded bg-white px-1">http://localhost</code>
            </li>
            <li>
              <code className="rounded bg-white px-1">http://127.0.0.1</code>
            </li>
          </ul>
          <span className="mt-1 block text-xs">
            위로 안 되면 포트 포함도 시도:{" "}
            <code className="rounded bg-white px-1">http://localhost:3000</code>
          </span>
        </li>
        <li>
          인증정보의 Client ID가{" "}
          <code className="rounded bg-white px-1">
            {NAVER_MAP_CLIENT_ID.slice(0, 4)}***
          </code>
          와 같은 Application인지 확인
        </li>
        <li>
          저장 후 1~2분 뒤{" "}
          <a
            href="/naver-map-test.html"
            className="font-semibold text-signature-dark underline"
          >
            /naver-map-test.html
          </a>
          에서 <strong>ncpKeyId</strong> 테스트 성공 여부 확인
        </li>
      </ol>
      <p className="mt-3 text-xs text-amber-800">
        접속 주소: <code className="rounded bg-white px-1">http://localhost:3000</code>
        (IP 주소·https 사용 시 인증 실패 가능)
      </p>
    </div>
  );
}
