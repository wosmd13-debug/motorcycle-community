"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import type { RouteWaypoint } from "@/lib/routes-data";

const NaverCourseBuilder = dynamic(
  () => import("@/components/member-routes/NaverCourseBuilder"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-stone-500">
        네이버 지도 불러오는 중...
      </div>
    ),
  }
);

const LeafletCourseBuilder = dynamic(
  () => import("@/components/member-routes/LeafletCourseBuilder"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-stone-500">
        지도 불러오는 중...
      </div>
    ),
  }
);

type CourseBuilderMapProps = {
  waypoints: RouteWaypoint[];
  onChange: (waypoints: RouteWaypoint[]) => void;
};

export default function CourseBuilderMap(props: CourseBuilderMapProps) {
  const [authFailed, setAuthFailed] = useState(false);
  const { ready, loading, error, configured, reload } = useNaverMapsReady();
  const useNaver = configured && (ready || loading) && !error && !authFailed;

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
    reload();
  }, [reload]);

  if (useNaver) {
    return (
      <MapErrorBoundary resetKey="course-builder">
        <NaverCourseBuilder {...props} onAuthFailure={handleAuthFailure} />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {configured && (authFailed || (error && !loading)) && (
        <>
          {error && (
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
          )}
          <NaverMapSetupGuide />
        </>
      )}
      <LeafletCourseBuilder {...props} />
    </div>
  );
}
