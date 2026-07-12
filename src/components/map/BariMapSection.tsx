"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { USE_NAVER_MAP } from "@/lib/map-config";
import type { MemberRoute } from "@/lib/member-route";
import type { BariRoute } from "@/lib/routes-data";

const NaverNationalBariMapSection = dynamic(
  () => import("@/components/map/NaverNationalBariMapSection"),
  { ssr: false }
);

const NationalBariMapSection = dynamic(
  () => import("@/components/map/NationalBariMapSection"),
  { ssr: false }
);

type BariMapSectionProps = {
  initialRouteId?: number;
  bariRoutes: BariRoute[];
  memberRoutes?: MemberRoute[];
  highlightPlaceId?: string;
};

export default function BariMapSection({
  initialRouteId,
  bariRoutes,
  memberRoutes = [],
  highlightPlaceId,
}: BariMapSectionProps) {
  const [authFailed, setAuthFailed] = useState(false);

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
  }, []);

  const resolvedRouteId =
    initialRouteId && bariRoutes.some((route) => route.id === initialRouteId)
      ? initialRouteId
      : undefined;

  if (USE_NAVER_MAP && !authFailed) {
    return (
      <MapErrorBoundary>
        <NaverNationalBariMapSection
          initialRouteId={resolvedRouteId}
          bariRoutes={bariRoutes}
          memberRoutes={memberRoutes}
          highlightPlaceId={highlightPlaceId}
          onAuthFailure={handleAuthFailure}
        />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {USE_NAVER_MAP && authFailed && <NaverMapSetupGuide />}
      <NationalBariMapSection
        key="osm-fallback"
        initialRouteId={resolvedRouteId}
        bariRoutes={bariRoutes}
        memberRoutes={memberRoutes}
        highlightPlaceId={highlightPlaceId}
      />
    </div>
  );
}
