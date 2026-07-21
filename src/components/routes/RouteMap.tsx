"use client";

import dynamic from "next/dynamic";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
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
  const { ready, loading, error, configured, reload } = useNaverMapsReady();
  const useNaver = configured && (ready || loading) && !error;

  if (useNaver) {
    return (
      <MapErrorBoundary resetKey={route.id}>
        <NaverRouteMap route={route} onAuthFailure={reload} />
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
      <LeafletRouteMap key={`osm-${route.id}`} route={route} />
    </div>
  );
}
