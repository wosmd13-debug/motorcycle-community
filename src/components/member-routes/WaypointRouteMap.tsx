"use client";

import dynamic from "next/dynamic";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
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
  const { ready, loading, error, configured, reload } = useNaverMapsReady();
  const useNaver = configured && (ready || loading) && !error;

  if (useNaver) {
    return (
      <MapErrorBoundary resetKey={mapKey}>
        <NaverWaypointRouteMap
          key={mapKey}
          waypoints={waypoints}
          mapKey={mapKey}
          onAuthFailure={reload}
        />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {configured && error && !loading && (
        <>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <p>{error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-3 min-h-[44px] rounded-full border border-[#03c75a]/35 bg-[#03c75a] px-4 py-2 text-xs font-bold text-white hover:bg-[#02b350]"
            >
              자동 복구 시도
            </button>
          </div>
          <NaverMapSetupGuide />
        </>
      )}
      <LeafletWaypointRouteMap
        key={mapKey}
        waypoints={waypoints}
        mapKey={mapKey}
      />
    </div>
  );
}
