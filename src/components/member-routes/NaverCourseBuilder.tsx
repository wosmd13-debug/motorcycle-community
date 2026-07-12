"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import { NAVER_MAP_CLIENT_ID } from "@/lib/map-config";
import {
  buildDirectionsQuery,
  pathToLatLngs,
  type DirectionsResult,
} from "@/lib/naver-directions";
import {
  detachNaverOverlay,
  getDefaultZoomControlPosition,
  getNaverMapInitErrorMessage,
  getNaverMaps,
  prepareNaverMap,
  resetMapContainer,
  subscribeNaverMapAuthFailure,
  teardownNaverMapContainer,
  triggerNaverMapResize,
  waitForElementRef,
} from "@/lib/naver-maps";
import { useLatest } from "@/lib/use-latest";
import type { RouteWaypoint } from "@/lib/routes-data";

type NaverCourseBuilderProps = {
  waypoints: RouteWaypoint[];
  onChange: (waypoints: RouteWaypoint[]) => void;
  onAuthFailure?: () => void;
};

const ROUTE_COLOR = "#22c55e";
const DEFAULT_CENTER = { lat: 36.5, lng: 127.8 };

async function fetchDirections(
  waypoints: RouteWaypoint[]
): Promise<DirectionsResult> {
  const query = buildDirectionsQuery(waypoints);
  if (!query) throw new Error("경유지가 부족합니다.");

  const params = new URLSearchParams({ start: query.start, goal: query.goal });
  if (query.waypoints) params.set("waypoints", query.waypoints);

  const response = await fetch(`/api/directions?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "경로를 불러오지 못했습니다.");
  return data as DirectionsResult;
}

export default function NaverCourseBuilder({
  waypoints,
  onChange,
  onAuthFailure,
}: NaverCourseBuilderProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const polylineRef = useRef<naver.maps.Polyline | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const clickListenerRef = useRef<unknown | null>(null);

  const onChangeRef = useLatest(onChange);
  const waypointsRef = useLatest(waypoints);
  const onAuthFailureRef = useLatest(onAuthFailure);

  const [mapReady, setMapReady] = useState(false);
  const [routeSummary, setRouteSummary] = useState<DirectionsResult["summary"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const { ready: sdkReady, loading: sdkLoading, reload: reloadSdk } =
    useNaverMapsReady();

  const clearOverlays = useCallback(() => {
    if (getNaverMaps()) {
      markersRef.current.forEach((marker) => detachNaverOverlay(marker));
      detachNaverOverlay(polylineRef.current);
    }
    markersRef.current = [];
    polylineRef.current = null;
  }, []);

  const renderOverlays = useCallback(
    async (map: naver.maps.Map, points: RouteWaypoint[]) => {
      const maps = getNaverMaps();
      if (!maps) return;

      clearOverlays();
      setRouteSummary(null);
      setError(null);

      if (points.length === 0) return;

      let pathLatLngs: naver.maps.LatLng[] = points.map(
        (waypoint) => new maps.LatLng(waypoint.lat, waypoint.lng)
      );

      if (points.length >= 2) {
        try {
          const directions = await fetchDirections(points);
          setRouteSummary(directions.summary);
          pathLatLngs = pathToLatLngs(directions.path).map(
            ([lat, lng]) => new maps.LatLng(lat, lng)
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : "경로 미리보기 실패");
        }
      }

      if (pathLatLngs.length > 1) {
        polylineRef.current = new maps.Polyline({
          map,
          path: pathLatLngs,
          strokeColor: ROUTE_COLOR,
          strokeWeight: 5,
          strokeOpacity: 0.9,
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });
      }

      points.forEach((waypoint, index) => {
        const isStart = index === 0;
        const isEnd = index === points.length - 1 && points.length > 1;
        const fill = isStart ? "#16a34a" : isEnd ? "#dc2626" : ROUTE_COLOR;

        const marker = new maps.Marker({
          map,
          position: new maps.LatLng(waypoint.lat, waypoint.lng),
          title: waypoint.name,
          icon: {
            content: `<div style="width:14px;height:14px;border-radius:9999px;background:${fill};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);"></div>`,
            size: new maps.Size(14, 14),
            anchor: new maps.Point(7, 7),
          },
        });
        markersRef.current.push(marker);
      });

      const bounds = new maps.LatLngBounds();
      pathLatLngs.forEach((point) => bounds.extend(point));
      if (pathLatLngs.length > 0) {
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      } else {
        map.panTo(new maps.LatLng(points[0].lat, points[0].lng));
        map.setZoom(12);
      }

      triggerNaverMapResize(map);
    },
    [clearOverlays]
  );

  useEffect(() => {
    return subscribeNaverMapAuthFailure(() => {
      onAuthFailureRef.current?.();
    });
  }, [onAuthFailureRef]);

  useEffect(() => {
    if (!sdkReady) {
      if (!sdkLoading) {
        setInitError(getNaverMapInitErrorMessage("sdk"));
      }
      return;
    }

    let active = true;

    const bootstrap = async () => {
      setInitError(null);
      setMapReady(false);
      clearOverlays();
      resetMapContainer(mapRef.current);

      const container = await waitForElementRef(() => mapRef.current, 8000);
      if (!active || !container) {
        if (active) setInitError("지도 영역을 준비하지 못했습니다.");
        return;
      }

      const result = await prepareNaverMap({
        clientId: NAVER_MAP_CLIENT_ID,
        container,
        getMapOptions: () => {
          const maps = getNaverMaps();
          if (!maps) throw new Error("naver maps unavailable");
          return {
            center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
            zoom: 7,
            zoomControl: true,
            zoomControlOptions: {
              position: getDefaultZoomControlPosition(),
            },
          };
        },
      });

      if (!active) return;

      if (!result.ok) {
        resetMapContainer(container);
        if (result.reason === "auth") {
          onAuthFailureRef.current?.();
          return;
        }
        setInitError(getNaverMapInitErrorMessage(result.reason));
        return;
      }

      mapInstance.current = result.map;
      const maps = getNaverMaps();
      if (maps && clickListenerRef.current == null) {
        clickListenerRef.current = (
          maps.Event.addListener as (
            target: naver.maps.Map,
            eventName: string,
            listener: (event: { coord: { lat: () => number; lng: () => number } }) => void
          ) => unknown
        )(result.map, "click", (event) => {
          const current = waypointsRef.current;
          const next: RouteWaypoint = {
            name:
              current.length === 0 ? "출발지" : `경유지 ${current.length}`,
            lat: Number(event.coord.lat().toFixed(6)),
            lng: Number(event.coord.lng().toFixed(6)),
          };
          onChangeRef.current([...current, next]);
        });
      }

      setMapReady(true);
      triggerNaverMapResize(result.map);
    };

    void bootstrap();

    return () => {
      active = false;
      clickListenerRef.current = null;
      clearOverlays();
      mapInstance.current = null;
      teardownNaverMapContainer(mapRef.current);
      setMapReady(false);
    };
  }, [
    bootAttempt,
    clearOverlays,
    onAuthFailureRef,
    onChangeRef,
    sdkReady,
    waypointsRef,
  ]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    void renderOverlays(mapInstance.current, waypoints);
  }, [mapReady, renderOverlays, waypoints]);

  return (
    <div className="space-y-2">
      <div className="relative h-[420px] overflow-hidden rounded-3xl border border-signature/20 bg-slate-100">
        <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-green-700 shadow-sm ring-1 ring-green-100">
          네이버 지도
        </span>
        {!mapReady && !initError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-signature-light text-sm text-stone-500">
            {sdkLoading ? "네이버 지도 SDK 불러오는 중..." : "네이버 지도 불러오는 중..."}
          </div>
        )}
        {initError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-signature-light p-6 text-center text-sm text-stone-600">
            <p>{initError}</p>
            <button
              type="button"
              onClick={() => {
                reloadSdk();
                setBootAttempt((value) => value + 1);
              }}
              className="rounded-full bg-signature-dark px-4 py-2 text-xs font-semibold text-white hover:bg-signature-darker"
            >
              다시 불러오기
            </button>
          </div>
        )}
        <div ref={mapRef} className="naver-map-root h-[420px] w-full" />
      </div>
      <p className="text-xs text-stone-500">
        지도를 클릭하면 경유지가 추가됩니다. 최소 2곳(출발·도착) 이상 찍어 주세요.
      </p>
      {routeSummary && (
        <p className="text-xs font-semibold text-signature-dark">
          예상 거리 {(routeSummary.distance / 1000).toFixed(1)}km · 약{" "}
          {Math.max(1, Math.round(routeSummary.duration / 60000))}분
        </p>
      )}
      {error && <p className="text-xs text-amber-700">{error} (직선 경로로 표시)</p>}
    </div>
  );
}
