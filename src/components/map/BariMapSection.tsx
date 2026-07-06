"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { USE_NAVER_MAP } from "@/lib/map-config";

const NaverNationalBariMapSection = dynamic(
  () => import("@/components/map/NaverNationalBariMapSection"),
  { ssr: false }
);

const NationalBariMapSection = dynamic(
  () => import("@/components/map/NationalBariMapSection"),
  { ssr: false }
);

export default function BariMapSection() {
  const [authFailed, setAuthFailed] = useState(false);

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
  }, []);

  if (USE_NAVER_MAP && !authFailed) {
    return (
      <MapErrorBoundary>
        <NaverNationalBariMapSection onAuthFailure={handleAuthFailure} />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {USE_NAVER_MAP && authFailed && <NaverMapSetupGuide />}
      <NationalBariMapSection key="osm-fallback" />
    </div>
  );
}
