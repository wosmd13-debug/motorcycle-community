"use client";

import { useCallback, useState } from "react";
import MapAccessNotice from "@/components/map/MapAccessNotice";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import PlainNaverMap from "@/components/map/PlainNaverMap";
import { USE_NAVER_MAP } from "@/lib/map-config";

export default function MapPageContent() {
  const [authFailed, setAuthFailed] = useState(false);

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
  }, []);

  if (!USE_NAVER_MAP || authFailed) {
    return (
      <div className="mt-6 space-y-4">
        <MapAccessNotice />
        {USE_NAVER_MAP && authFailed && <NaverMapSetupGuide />}
        {!USE_NAVER_MAP && (
          <div className="rounded-3xl border border-dashed border-signature/30 bg-signature-light px-6 py-12 text-center text-sm text-slate-600">
            네이버 지도 API 키가 설정되지 않았습니다. 환경 변수를 확인해 주세요.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <MapAccessNotice />
      <MapErrorBoundary>
        <PlainNaverMap onAuthFailure={handleAuthFailure} />
      </MapErrorBoundary>
    </div>
  );
}
