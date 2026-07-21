"use client";

import dynamic from "next/dynamic";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import type { ServiceMapViewMode } from "@/components/services/NaverServicePlacesMap";
import type { MapFlyToTarget } from "@/components/services/map-types";
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
  flyToTarget?: MapFlyToTarget | null;
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
  const { ready, loading, error, configured, reload } = useNaverMapsReady();
  const useNaver = configured && (ready || loading) && !error;

  if (useNaver) {
    return (
      <MapErrorBoundary>
        <NaverServicePlacesMap
          {...props}
          viewMode={viewMode}
          onAuthFailure={reload}
        />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {configured && error && !loading && (
        <>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
            <p>
              네이버 지도 인증에 실패해 OpenStreetMap으로 표시합니다. 아래 서버
              진단을 확인하거나 자동 복구를 시도해 주세요.
            </p>
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
      <OsmServicePlacesMap {...props} viewMode={viewMode} />
    </div>
  );
}
