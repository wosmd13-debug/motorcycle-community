"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import MapLayoutProvider from "@/components/map/MapLayoutProvider";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { USE_NAVER_MAP } from "@/lib/map-config";

const PlainNaverMap = dynamic(() => import("@/components/map/PlainNaverMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[200px] items-center justify-center bg-signature-light text-sm text-slate-500">
      네이버 지도 불러오는 중...
    </div>
  ),
});

export default function HomeMapPreview() {
  const [authFailed, setAuthFailed] = useState(false);

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
  }, []);

  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <h2 className="portal-panel-title">네이버 지도</h2>
        <Link href="/map" className="portal-panel-more">
          전체
        </Link>
      </div>

      {USE_NAVER_MAP && !authFailed ? (
        <MapLayoutProvider>
          <MapErrorBoundary>
            <PlainNaverMap
              onAuthFailure={handleAuthFailure}
              className="portal-sidebar-map"
            />
          </MapErrorBoundary>
        </MapLayoutProvider>
      ) : (
        <div className="space-y-3 p-3">
          {USE_NAVER_MAP && authFailed && <NaverMapSetupGuide />}
          {!USE_NAVER_MAP && (
            <p className="px-2 py-6 text-center text-xs leading-5 text-slate-500">
              네이버 지도 API 키가 설정되지 않았습니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
