"use client";

import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import PlainNaverMap from "@/components/map/PlainNaverMap";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";

export default function MapPageContent() {
  const { ready, loading, error, configured, reload } = useNaverMapsReady();

  if (!configured && !loading) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-signature/30 bg-signature-light px-6 py-12 text-center text-sm text-slate-600">
        네이버 지도 API 키가 설정되지 않았습니다.{" "}
        <code className="rounded bg-white px-1">.env.production</code>에{" "}
        <code className="rounded bg-white px-1">
          NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
        </code>
        를 설정한 뒤{" "}
        <code className="rounded bg-white px-1">
          docker compose --env-file .env.production up -d --build
        </code>
        로 재빌드해 주세요.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {error && !loading && !ready && (
        <>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <p>{error}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reload}
                className="min-h-[44px] rounded-full border border-[#03c75a]/35 bg-[#03c75a] px-4 py-2 text-xs font-bold text-white hover:bg-[#02b350]"
              >
                자동 복구 시도
              </button>
              <a
                href="/naver-map-test.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
              >
                인증 테스트
              </a>
            </div>
          </div>
          <NaverMapSetupGuide />
        </>
      )}

      <MapErrorBoundary>
        <PlainNaverMap
          onAuthFailure={reload}
          className="portal-map-frame portal-map-frame-live sm:min-h-[420px]"
        />
      </MapErrorBoundary>
    </div>
  );
}
