"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { USE_NAVER_MAP } from "@/lib/map-config";
import { checkNaverMapsReady, resetNaverMapsSdkLoad } from "@/lib/naver-maps";
import type { BariRoute } from "@/lib/routes-data";

const NaverRouteMap = dynamic(
  () => import("@/components/routes/NaverRouteMap"),
  { ssr: false }
);

const LeafletRouteMap = dynamic(
  () => import("@/components/routes/LeafletRouteMap"),
  { ssr: false }
);

type RouteMapProps = {
  route: BariRoute;
};

export default function RouteMap({ route }: RouteMapProps) {
  const [authFailed, setAuthFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleAuthFailure = useCallback(() => {
    window.setTimeout(() => {
      if (checkNaverMapsReady()) return;
      setAuthFailed(true);
    }, 1200);
  }, []);

  const handleRetryNaverMap = useCallback(() => {
    resetNaverMapsSdkLoad();
    setAuthFailed(false);
    setRetryKey((value) => value + 1);
  }, []);

  if (USE_NAVER_MAP && !authFailed) {
    return (
      <MapErrorBoundary resetKey={route.id}>
        <NaverRouteMap
          key={retryKey}
          route={route}
          onAuthFailure={handleAuthFailure}
        />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {USE_NAVER_MAP && authFailed && (
        <>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <p>
              네이버 지도 인증에 실패했습니다. PC·모바일 모두{" "}
              <strong>https://byanra.com</strong> 도메인으로 접속해야 합니다.
            </p>
            <button
              type="button"
              onClick={handleRetryNaverMap}
              className="mt-3 min-h-[44px] rounded-full border border-[#03c75a]/35 bg-[#03c75a] px-4 py-2 text-xs font-bold text-white hover:bg-[#02b350]"
            >
              네이버 지도 다시 시도
            </button>
          </div>
          <NaverMapSetupGuide />
        </>
      )}
      <LeafletRouteMap key={`osm-${route.id}`} route={route} />
    </div>
  );
}
