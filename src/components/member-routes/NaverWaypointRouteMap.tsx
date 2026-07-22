"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import {
  useNaverMapClientId,
  useNaverMapsReady,
} from "@/components/map/NaverMapsProvider";
import {
  buildDirectionsQuery,
  isDirectionsConfigError,
  normalizeDirectionsError,
  pathToLatLngs,
  type DirectionsResult,
} from "@/lib/naver-directions";
import {
  buildServiceMapOptions,
  checkNaverMapsReady,
  detachNaverOverlay,
  getNaverMapInitErrorMessage,
  getNaverMaps,
  isNaverMapAuthFailed,
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
  if (!response.ok) {
    throw new Error(
      normalizeDirectionsError(data.error ?? "경로를 불러오지 못했습니다.")
    );
  }
  return data as DirectionsResult;
}

function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}시간 ${rest}분` : `${hours}시간`;
}

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${meters}m`;
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
  const renderGenerationRef = useRef(0);
  const onAuthFailureRef = useLatest(onAuthFailure);

  const [mapReady, setMapReady] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState<
    DirectionsResult["summary"] | null
  >(null);
  const [useWaypointFallback, setUseWaypointFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const clientId = useNaverMapClientId();
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
    async (map: naver.maps.Map, generation: number) => {
      if (mapInstance.current !== map) return;

      try {
        const maps = getNaverMaps();
        if (!maps || waypoints.length === 0) return;

        clearOverlays();
        setRouteLoading(true);
        setRouteSummary(null);
        setError(null);
        setUseWaypointFallback(false);

        let pathLatLngs: naver.maps.LatLng[] = [];

        if (waypoints.length >= 2) {
          try {
            const directions = await fetchDirections(waypoints);
            if (
              renderGenerationRef.current !== generation ||
              mapInstance.current !== map
            ) {
              return;
            }

            const mapsAfterFetch = getNaverMaps();
            if (!mapsAfterFetch) return;

            setRouteSummary(directions.summary);
            pathLatLngs = pathToLatLngs(directions.path).map(
              ([lat, lng]) => new mapsAfterFetch.LatLng(lat, lng)
            );
          } catch (err) {
            if (
              renderGenerationRef.current !== generation ||
              mapInstance.current !== map
            ) {
              return;
            }

            const mapsAfterError = getNaverMaps();
            if (!mapsAfterError) return;

            setUseWaypointFallback(true);
            setError(
              normalizeDirectionsError(
                err instanceof Error ? err.message : "경로를 불러오지 못했습니다."
              )
            );
            pathLatLngs = waypoints.map(
              (waypoint) =>
                new mapsAfterError.LatLng(waypoint.lat, waypoint.lng)
            );
          }
        } else {
          pathLatLngs = waypoints.map(
            (waypoint) => new maps.LatLng(waypoint.lat, waypoint.lng)
          );
        }

        if (
          renderGenerationRef.current !== generation ||
          mapInstance.current !== map
        ) {
          return;
        }

        const activeMaps = getNaverMaps();
        if (!activeMaps) return;

        if (pathLatLngs.length > 1) {
          polylineRef.current = new activeMaps.Polyline({
            map,
            path: pathLatLngs,
            strokeColor: ROUTE_COLOR,
            strokeWeight: 5,
            strokeOpacity: 0.9,
            strokeLineCap: "round",
            strokeLineJoin: "round",
          });
        }

        waypoints.forEach((waypoint) => {
          const marker = new activeMaps.Marker({
            map,
            position: new activeMaps.LatLng(waypoint.lat, waypoint.lng),
            title: waypoint.name,
            icon: {
              content: `<div style="width:14px;height:14px;border-radius:9999px;background:${ROUTE_COLOR};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);"></div>`,
              size: new activeMaps.Size(14, 14),
              anchor: new activeMaps.Point(7, 7),
            },
          });
          markersRef.current.push(marker);
        });

        const bounds = new activeMaps.LatLngBounds();
        pathLatLngs.forEach((point) => bounds.extend(point));
        waypoints.forEach((waypoint) => {
          bounds.extend(new activeMaps.LatLng(waypoint.lat, waypoint.lng));
        });

        if (pathLatLngs.length > 0) {
          map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
        } else if (waypoints[0]) {
          map.panTo(new activeMaps.LatLng(waypoints[0].lat, waypoints[0].lng));
          map.setZoom(10);
        }

        triggerNaverMapResize(map);
      } catch (err) {
        if (renderGenerationRef.current !== generation) return;
        setError(
          err instanceof Error ? err.message : "경로를 지도에 표시하지 못했습니다."
        );
      } finally {
        if (renderGenerationRef.current === generation) {
          setRouteLoading(false);
        }
      }
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
      if (sdkLoading) {
        setInitError(null);
      } else {
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
        clientId,
        container,
        getMapOptions: () => {
          const maps = getNaverMaps();
          if (!maps) throw new Error("naver maps unavailable");
          return buildServiceMapOptions(maps, DEFAULT_CENTER, 10);
        },
      });

      if (!active) {
        if (result.ok) resetMapContainer(container);
        return;
      }

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
      renderGenerationRef.current += 1;
      clearOverlays();
      mapInstance.current = null;
      teardownNaverMapContainer(mapRef.current);
      setMapReady(false);
    };
  }, [bootAttempt, clearOverlays, clientId, sdkReady]);

  useEffect(() => {
    if (!mapReady) return;

    const timer = window.setTimeout(() => {
      if (isNaverMapAuthFailed() && !checkNaverMapsReady()) {
        onAuthFailureRef.current?.();
      }
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [mapReady, onAuthFailureRef]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const generation = ++renderGenerationRef.current;
    void renderRoute(mapInstance.current, generation);
  }, [mapKey, mapReady, renderRoute]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const handleResize = () => {
      if (mapInstance.current) triggerNaverMapResize(mapInstance.current);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mapReady]);

  return (
    <div className="space-y-2">
      {error && isDirectionsConfigError(error) && <NaverMapSetupGuide />}
      <div className="relative h-[320px] overflow-hidden rounded-3xl border border-signature/20 bg-slate-100 shadow-sm lg:h-[420px]">
        <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-green-700 shadow-sm ring-1 ring-green-100">
          네이버 지도
        </span>
        {error && (
          <div
            className={`absolute inset-x-0 top-0 z-20 px-4 py-2 text-center text-xs ${
              isDirectionsConfigError(error)
                ? "bg-amber-50 text-amber-900"
                : "bg-red-50 text-red-600"
            }`}
          >
            {error}
          </div>
        )}
        {(!mapReady || routeLoading) && !initError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-signature-light text-sm text-slate-500">
            {routeLoading
              ? "오토바이 경로 계산 중..."
              : sdkLoading
                ? "네이버 지도 SDK 불러오는 중..."
                : "네이버 지도 불러오는 중..."}
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
          className="naver-map-root h-[320px] w-full lg:h-[420px]"
        />
      </div>

      {routeSummary && (
        <p className="text-center text-xs text-slate-500">
          이륜차 통행 가능 경로 · 약{" "}
          <strong className="text-signature-dark">
            {formatDistance(routeSummary.distance)}
          </strong>
          {" · "}
          <strong className="text-signature-dark">
            {formatDuration(routeSummary.duration)}
          </strong>{" "}
          (자동차전용도로 회피)
        </p>
      )}
      {useWaypointFallback && mapReady && (
        <p className="text-center text-xs text-slate-400">
          경로 API를 사용할 수 없어 경유지를 직선으로 연결해 표시합니다.
        </p>
      )}
    </div>
  );
}
