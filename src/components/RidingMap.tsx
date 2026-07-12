"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { USE_NAVER_MAP } from "@/lib/map-config";
import type { RidingSpot } from "@/lib/mock-data";

const NaverMap = dynamic(() => import("@/components/NaverMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500">
      네이버 지도 불러오는 중...
    </div>
  ),
});

const OpenStreetMap = dynamic(() => import("@/components/OpenStreetMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500">
      지도 불러오는 중...
    </div>
  ),
});

type RidingMapProps = {
  spots: RidingSpot[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export default function RidingMap(props: RidingMapProps) {
  const [authFailed, setAuthFailed] = useState(false);

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
  }, []);

  if (USE_NAVER_MAP && !authFailed) {
    return (
      <MapErrorBoundary>
        <NaverMap {...props} onAuthFailure={handleAuthFailure} />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {USE_NAVER_MAP && authFailed && <NaverMapSetupGuide />}
      <OpenStreetMap {...props} />
    </div>
  );
}
