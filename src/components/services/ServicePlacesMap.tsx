"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import type { ServiceMapViewMode } from "@/components/services/NaverServicePlacesMap";
import { USE_NAVER_MAP } from "@/lib/map-config";
import type { LiveFuelStation } from "@/lib/opinet-service";
import type { RiderPlace } from "@/lib/places-data";

const NaverServicePlacesMap = dynamic(
  () => import("@/components/services/NaverServicePlacesMap"),
  {
    ssr: false,
    loading: () => (
      <div className="portal-map-frame flex items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500">
        네이버 지도 불러오는 중...
      </div>
    ),
  }
);

const OsmServicePlacesMap = dynamic(
  () => import("@/components/services/OsmServicePlacesMap"),
  {
    ssr: false,
    loading: () => (
      <div className="portal-map-frame flex items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500">
        지도 불러오는 중...
      </div>
    ),
  }
);

type ServicePlacesMapProps = {
  places: RiderPlace[];
  liveStations?: LiveFuelStation[];
  viewMode?: ServiceMapViewMode;
  mapCenter?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  mapFrameClassName?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCenterChange?: (center: { lat: number; lng: number }) => void;
};

export default function ServicePlacesMap({
  viewMode = "curated",
  ...props
}: ServicePlacesMapProps) {
  const [authFailed, setAuthFailed] = useState(false);

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
  }, []);

  if (USE_NAVER_MAP && !authFailed) {
    return (
      <MapErrorBoundary>
        <NaverServicePlacesMap
          {...props}
          viewMode={viewMode}
          onAuthFailure={handleAuthFailure}
        />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {USE_NAVER_MAP && authFailed && (
        <>
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
            네이버 지도 인증에 실패해 OpenStreetMap으로 실시간 유가를 표시합니다.
            모바일에서 접속 중이라면 NCP 콘솔 Web URL에 현재 주소도 등록해 주세요.
          </p>
          <NaverMapSetupGuide />
        </>
      )}
      <OsmServicePlacesMap {...props} viewMode={viewMode} />
    </div>
  );
}
