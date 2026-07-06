"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { USE_NAVER_MAP } from "@/lib/map-config";
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

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
  }, []);

  if (USE_NAVER_MAP && !authFailed) {
    return (
      <MapErrorBoundary resetKey={route.id}>
        <NaverRouteMap route={route} onAuthFailure={handleAuthFailure} />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {USE_NAVER_MAP && authFailed && <NaverMapSetupGuide />}
      <LeafletRouteMap key={`osm-${route.id}`} route={route} />
    </div>
  );
}
