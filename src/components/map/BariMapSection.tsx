"use client";

import dynamic from "next/dynamic";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import type { MemberRoute } from "@/lib/member-route";
import type { BariRoute } from "@/lib/routes-data";

const NaverNationalBariMapSection = dynamic(
  () => import("@/components/map/NaverNationalBariMapSection"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500">
        네이버 지도 불러오는 중...
      </div>
    ),
  }
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
  const { ready, loading, error, configured, reload } = useNaverMapsReady();

  const resolvedRouteId =
    initialRouteId && bariRoutes.some((route) => route.id === initialRouteId)
      ? initialRouteId
      : undefined;

  if (!configured && !loading) {
    return (
      <div className="space-y-3">
        <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-signature/30 bg-signature-light px-6 text-center text-sm text-slate-600">
          네이버 지도 API 키가 설정되지 않았습니다.
        </div>
        <NaverMapSetupGuide />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && !loading && !ready && (
        <>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <p>{error}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reload}
                className="min-h-[44px] rounded-full border border-[#03c75a]/35 bg-[#03c75a] px-4 py-2 text-xs font-bold text-white hover:bg-[#02b350]"
              >
                다시 시도
              </button>
            </div>
          </div>
          <NaverMapSetupGuide />
        </>
      )}

      {(ready || loading) && (
        <MapErrorBoundary>
          <NaverNationalBariMapSection
            initialRouteId={resolvedRouteId}
            bariRoutes={bariRoutes}
            memberRoutes={memberRoutes}
            highlightPlaceId={highlightPlaceId}
            onAuthFailure={reload}
          />
        </MapErrorBoundary>
      )}
    </div>
  );
}
