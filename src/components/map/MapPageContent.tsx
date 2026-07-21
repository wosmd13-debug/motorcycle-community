"use client";

import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import PlainNaverMap from "@/components/map/PlainNaverMap";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import { USE_NAVER_MAP } from "@/lib/map-config";
import {
  checkNaverMapsReady,
  resetNaverMapsSdkLoad,
} from "@/lib/naver-maps";

export default function MapPageContent() {
  const [authFailed, setAuthFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const { reload } = useNaverMapsReady();

  const handleAuthFailure = useCallback(() => {
    window.setTimeout(() => {
      if (checkNaverMapsReady()) return;
      setAuthFailed(true);
    }, 1200);
  }, []);

  const handleRetryNaverMap = useCallback(() => {
    resetNaverMapsSdkLoad();
    setAuthFailed(false);
    reload();
    setRetryKey((value) => value + 1);
  }, [reload]);

  if (!USE_NAVER_MAP) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-signature/30 bg-signature-light px-6 py-12 text-center text-sm text-slate-600">
        네이버 지도 API 키가 설정되지 않았습니다.{" "}
        <code className="rounded bg-white px-1">.env.production</code>에{" "}
        <code className="rounded bg-white px-1">
          NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
        </code>
        를 설정한 뒤 Docker 이미지를 다시 빌드해 주세요.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {authFailed && (
        <>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <p>
              네이버 지도 인증에 실패했습니다. 아래 설정을 확인하거나 다시
              시도해 주세요. PC·모바일 모두 같은 도메인(
              <strong>https://byanra.com</strong>)으로 접속해야 합니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRetryNaverMap}
                className="min-h-[44px] rounded-full border border-[#03c75a]/35 bg-[#03c75a] px-4 py-2 text-xs font-bold text-white hover:bg-[#02b350]"
              >
                네이버 지도 다시 시도
              </button>
              <a
                href="/naver-map-test.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
              >
                인증 테스트 페이지
              </a>
            </div>
          </div>
          <NaverMapSetupGuide />
        </>
      )}

      <MapErrorBoundary>
        <PlainNaverMap
          key={retryKey}
          onAuthFailure={handleAuthFailure}
          className="portal-map-frame portal-map-frame-live sm:min-h-[420px]"
        />
      </MapErrorBoundary>
    </div>
  );
}
