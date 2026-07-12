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

type NaverWaypointRouteMapProps = {
  waypoints: RouteWaypoint[];
  mapKey: string;
  onAuthFailure?: () => void;
};

const ROUTE_COLOR = "#22c55e";

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

export default function NaverWaypointRouteMap({
  waypoints,
  mapKey,
  onAuthFailure,
}: NaverWaypointRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const polylineRef = useRef<naver.maps.Polyline | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const onAuthFailureRef = useLatest(onAuthFailure);

  const [mapReady, setMapReady] = useState(false);
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

  const renderRoute = useCallback(
    async (map: naver.maps.Map) => {
      const maps = getNaverMaps();
      if (!maps || waypoints.length === 0) return;

      clearOverlays();

      let pathLatLngs: naver.maps.LatLng[] = waypoints.map(
        (waypoint) => new maps.LatLng(waypoint.lat, waypoint.lng)
      );

      if (waypoints.length >= 2) {
        try {
          const directions = await fetchDirections(waypoints);
          pathLatLngs = pathToLatLngs(directions.path).map(
            ([lat, lng]) => new maps.LatLng(lat, lng)
          );
        } catch {
          // straight line fallback
        }
      }

      if (pathLatLngs.length > 1) {
        polylineRef.current = new maps.Polyline({
          map,
          path: pathLatLngs,
          strokeColor: ROUTE_COLOR,
          strokeWeight: 5,
          strokeOpacity: 0.9,
        });
      }

      waypoints.forEach((waypoint, index) => {
        const marker = new maps.Marker({
          map,
          position: new maps.LatLng(waypoint.lat, waypoint.lng),
          title: waypoint.name,
          icon: {
            content: `<div style="width:14px;height:14px;border-radius:9999px;background:${ROUTE_COLOR};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);"></div>`,
            size: new maps.Size(14, 14),
            anchor: new maps.Point(7, 7),
          },
        });
        markersRef.current.push(marker);
      });

      const bounds = new maps.LatLngBounds();
      pathLatLngs.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
      triggerNaverMapResize(map);
    },
    [clearOverlays, waypoints]
  );

  useEffect(() => {
    return subscribeNaverMapAuthFailure(() => {
      onAuthFailureRef.current?.();
    });
  }, [onAuthFailureRef]);

  useEffect(() => {
    if (!sdkReady) {
      if (!sdkLoading) setInitError(getNaverMapInitErrorMessage("sdk"));
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

      const center = waypoints[0] ?? { lat: 36.5, lng: 127.8 };
      const result = await prepareNaverMap({
        clientId: NAVER_MAP_CLIENT_ID,
        container,
        getMapOptions: () => {
          const maps = getNaverMaps();
          if (!maps) throw new Error("naver maps unavailable");
          return {
            center: new maps.LatLng(center.lat, center.lng),
            zoom: 10,
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
      setMapReady(true);
      triggerNaverMapResize(result.map);
    };

    void bootstrap();

    return () => {
      active = false;
      clearOverlays();
      mapInstance.current = null;
      teardownNaverMapContainer(mapRef.current);
      setMapReady(false);
    };
  }, [bootAttempt, clearOverlays, mapKey, onAuthFailureRef, sdkReady, waypoints]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    void renderRoute(mapInstance.current);
  }, [mapReady, renderRoute]);

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-signature/20 bg-slate-100 lg:min-h-[420px]">
      <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-green-700 shadow-sm ring-1 ring-green-100">
        네이버 지도
      </span>
      {!mapReady && !initError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-signature-light text-sm text-slate-500">
          {sdkLoading ? "네이버 지도 SDK 불러오는 중..." : "네이버 지도 불러오는 중..."}
        </div>
      )}
      {initError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-signature-light p-6 text-center text-sm text-slate-600">
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
      <div
        ref={mapRef}
        className="naver-map-root min-h-[320px] w-full lg:min-h-[420px]"
      />
    </div>
  );
}
