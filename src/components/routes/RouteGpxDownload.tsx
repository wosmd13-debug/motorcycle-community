"use client";

import { useState } from "react";

type RouteGpxDownloadProps = {
  routeId?: number;
  memberRouteId?: string;
  routeName: string;
};

export default function RouteGpxDownload({
  routeId,
  memberRouteId,
  routeName,
}: RouteGpxDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (routeId != null) params.set("routeId", String(routeId));
      if (memberRouteId) params.set("memberRouteId", memberRouteId);

      const response = await fetch(`/api/routes/gpx?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "GPX 다운로드에 실패했습니다.");
      }

      const source = response.headers.get("X-Gpx-Source");
      setLastSource(source);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${routeName.replace(/[\\/:*?"<>|]/g, "-")}.gpx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "GPX 다운로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-violet-900">GPX 다운로드</p>
          <p className="mt-1 text-xs leading-5 text-violet-800/80">
            내비·액션캠·GPX 뷰어 앱에서 사용할 수 있는 경로 파일입니다. 가능하면
            이륜차 통행 경로 좌표를 포함합니다.
          </p>
          {lastSource === "waypoints" && (
            <p className="mt-2 text-[11px] text-violet-700">
              경로 API를 사용할 수 없어 경유지 연결 GPX로 저장되었습니다.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={loading}
          className="rounded-full bg-violet-700 px-4 py-2 text-xs font-bold text-white hover:bg-violet-800 disabled:opacity-60"
        >
          {loading ? "생성 중..." : "GPX 받기"}
        </button>
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
