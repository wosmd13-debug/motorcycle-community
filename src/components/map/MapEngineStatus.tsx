"use client";

import { useEffect, useState } from "react";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import { USE_NAVER_MAP } from "@/lib/map-config";

type MapStatus = {
  tileProvider: "naver" | "openstreetmap";
  directionsOk: boolean;
  naverEnabled: boolean;
  browserSdkReady: boolean;
  browserSdkLoading: boolean;
};

export default function MapEngineStatus() {
  const { ready, loading } = useNaverMapsReady();
  const [status, setStatus] = useState<MapStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/naver/check", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { directions?: string; mapMode?: string; useNaverMapEnabled?: boolean }) => {
        if (cancelled) return;
        setStatus({
          tileProvider:
            data.mapMode === "naver" || USE_NAVER_MAP ? "naver" : "openstreetmap",
          directionsOk: data.directions === "ok",
          naverEnabled: Boolean(data.useNaverMapEnabled ?? USE_NAVER_MAP),
          browserSdkReady: ready,
          browserSdkLoading: loading,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setStatus({
          tileProvider: USE_NAVER_MAP ? "naver" : "openstreetmap",
          directionsOk: false,
          naverEnabled: USE_NAVER_MAP,
          browserSdkReady: ready,
          browserSdkLoading: loading,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [ready, loading]);

  if (!status) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-2.5 text-xs text-emerald-900">
      <span className="font-semibold">
        {status.naverEnabled ? "🗺️ 네이버 지도 모드" : "🗺️ 지도 활성화됨"}
      </span>
      <span
        className={`rounded-full px-2.5 py-0.5 ring-1 ${
          status.tileProvider === "naver"
            ? "bg-green-50 text-green-800 ring-green-100"
            : "bg-white text-slate-600 ring-slate-200"
        }`}
      >
        타일: {status.tileProvider === "naver" ? "네이버 지도" : "OpenStreetMap"}
      </span>
      <span
        className={`rounded-full px-2.5 py-0.5 ring-1 ${
          status.browserSdkReady
            ? "bg-white text-emerald-800 ring-emerald-100"
            : status.browserSdkLoading
              ? "bg-amber-50 text-amber-800 ring-amber-100"
              : "bg-red-50 text-red-800 ring-red-100"
        }`}
      >
        브라우저 SDK:{" "}
        {status.browserSdkReady
          ? "준비됨 ✅"
          : status.browserSdkLoading
            ? "로딩 중…"
            : "실패 ❌"}
      </span>
      <span
        className={`rounded-full px-2.5 py-0.5 ring-1 ${
          status.directionsOk
            ? "bg-white text-emerald-800 ring-emerald-100"
            : "bg-amber-50 text-amber-800 ring-amber-100"
        }`}
      >
        경로: {status.directionsOk ? "네이버 Directions ✅" : "경로 API 확인 필요"}
      </span>
    </div>
  );
}
