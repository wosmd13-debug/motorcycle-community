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

  if (!configured && !loading) {
    return (
      <div className="space-y-3">
        <div className="portal-map-frame flex items-center justify-center rounded-3xl border border-dashed border-signature/30 bg-signature-light px-6 text-center text-sm text-slate-600">
          네이버 지도 API 키가 설정되지 않았습니다. 서버 `.env.production`의
          Client ID를 확인한 뒤 재빌드해 주세요.
        </div>
        <NaverMapSetupGuide />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && !loading && !ready && (
        <>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
            <p>
              네이버 지도를 불러오지 못했습니다. OpenStreetMap으로 대체하지
              않습니다. 아래 진단으로 인증을 복구한 뒤 다시 시도해 주세요.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reload}
                className="min-h-[44px] rounded-full border border-[#03c75a]/35 bg-[#03c75a] px-4 py-2 text-xs font-bold text-white hover:bg-[#02b350]"
              >
                다시 시도
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

      {(ready || loading) && (
        <MapErrorBoundary>
          <NaverServicePlacesMap
            {...props}
            viewMode={viewMode}
            onAuthFailure={reload}
          />
        </MapErrorBoundary>
      )}
    </div>
  );
}
