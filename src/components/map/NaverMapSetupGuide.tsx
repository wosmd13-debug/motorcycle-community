"use client";

import { USE_NAVER_MAP } from "@/lib/map-config";

export default function NaverMapSetupGuide() {
  if (!USE_NAVER_MAP) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p className="font-bold">네이버 지도 타일 인증이 필요합니다</p>
      <p className="mt-2 leading-6 text-amber-900">
        경로 API(Directions)는 서버에서 동작해도, <strong>브라우저 지도</strong>는 Web
        서비스 URL이 정확히 맞아야 합니다. 포트 번호 없이{" "}
        <code className="rounded bg-white px-1">http://localhost</code>만 등록하면{" "}
        <strong>localhost:3000</strong>에서는 인증이 실패할 수 있습니다.
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-6 text-amber-900">
        <li>
          <a
            href="https://console.ncloud.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-orange-600 underline"
          >
            네이버 클라우드 콘솔
          </a>
          {" → Application Services → Maps → Application(rydermom)"}
        </li>
        <li>
          <strong>API 선택</strong> 탭 → <strong>Dynamic Map(Web)</strong> 체크 후 저장
        </li>
        <li>
          <strong>Application 등록</strong> 탭 → <strong>Web 서비스 URL</strong>에 아래
          주소를 <strong>포트 포함</strong>으로 등록:
          <ul className="mt-1 list-disc pl-5">
            <li>
              <code className="rounded bg-white px-1">http://localhost:3000</code>
            </li>
            <li>
              <code className="rounded bg-white px-1">http://127.0.0.1:3000</code>
            </li>
          </ul>
        </li>
        <li>
          저장 후 1~2분 기다렸다가{" "}
          <code className="rounded bg-white px-1">http://localhost:3000/naver-map-test.html</code>
          에서 지도가 보이는지 확인
        </li>
        <li>
          Client ID가{" "}
          <code className="rounded bg-white px-1">NEXT_PUBLIC_NAVER_MAP_CLIENT_ID</code>
          와 동일한지 확인
        </li>
      </ol>
      <p className="mt-3 text-xs text-amber-800">
        브라우저 주소는 반드시 <code className="rounded bg-white px-1">http://localhost:3000</code>
        으로 접속하세요. (IP 주소·https 사용 시 실패)
      </p>
    </div>
  );
}
