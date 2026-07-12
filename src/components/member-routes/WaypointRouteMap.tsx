"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { USE_NAVER_MAP } from "@/lib/map-config";
import type { RouteWaypoint } from "@/lib/routes-data";

const NaverWaypointRouteMap = dynamic(
  () => import("@/components/member-routes/NaverWaypointRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500 lg:min-h-[420px]">
        네이버 지도 불러오는 중...
      </div>
    ),
  }
);

const LeafletWaypointRouteMap = dynamic(
  () => import("@/components/member-routes/LeafletWaypointRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500 lg:min-h-[420px]">
        지도 불러오는 중...
      </div>
    ),
  }
);

type WaypointRouteMapProps = {
  waypoints: RouteWaypoint[];
  mapKey: string;
};

export default function WaypointRouteMap({ waypoints, mapKey }: WaypointRouteMapProps) {
  const [authFailed, setAuthFailed] = useState(false);

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
  }, []);

  if (USE_NAVER_MAP && !authFailed) {
    return (
      <MapErrorBoundary resetKey={mapKey}>
        <NaverWaypointRouteMap
          waypoints={waypoints}
          mapKey={mapKey}
          onAuthFailure={handleAuthFailure}
        />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {USE_NAVER_MAP && authFailed && <NaverMapSetupGuide />}
      <LeafletWaypointRouteMap waypoints={waypoints} mapKey={mapKey} />
    </div>
  );
}
