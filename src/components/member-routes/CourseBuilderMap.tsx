"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import MapErrorBoundary from "@/components/map/MapErrorBoundary";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { USE_NAVER_MAP } from "@/lib/map-config";
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

  const handleAuthFailure = useCallback(() => {
    setAuthFailed(true);
  }, []);

  if (USE_NAVER_MAP && !authFailed) {
    return (
      <MapErrorBoundary resetKey="course-builder">
        <NaverCourseBuilder {...props} onAuthFailure={handleAuthFailure} />
      </MapErrorBoundary>
    );
  }

  return (
    <div className="space-y-3">
      {USE_NAVER_MAP && authFailed && <NaverMapSetupGuide />}
      <LeafletCourseBuilder {...props} />
    </div>
  );
}
