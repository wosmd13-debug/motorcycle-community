"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildDirectionsQuery,
  pathToLatLngs,
  type DirectionsResult,
} from "@/lib/naver-directions";
import {
  addNaverMapListener,
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
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import { useLatest } from "@/lib/use-latest";
import { NAVER_MAP_CLIENT_ID } from "@/lib/map-config";
import { bariRoutes, type BariRoute } from "@/lib/routes-data";

const ROUTE_COLOR = "#f97316";
const MUTED_COLOR = "#94a3b8";

type NaverNationalBariMapSectionProps = {
  onAuthFailure?: () => void;
};

async function fetchRoutePath(route: BariRoute): Promise<[number, number][]> {
  const query = buildDirectionsQuery(route.waypoints);
  if (!query) {
    return route.waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);
  }

  const params = new URLSearchParams({ start: query.start, goal: query.goal });
  if (query.waypoints) {
    params.set("waypoints", query.waypoints);
  }

  try {
    const response = await fetch(`/api/directions?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
    return pathToLatLngs((data as DirectionsResult).path);
  } catch {
    return route.waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);
  }
}

export default function NaverNationalBariMapSection({
  onAuthFailure,
}: NaverNationalBariMapSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const polylinesRef = useRef<naver.maps.Polyline[]>([]);
  const markersRef = useRef<naver.maps.Marker[]>([]);

  const [selectedId, setSelectedId] = useState(bariRoutes[0]?.id ?? 1);
  const [mapReady, setMapReady] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const selectedRoute =
    bariRoutes.find((route) => route.id === selectedId) ?? bariRoutes[0];

  const { ready: sdkReady, loading: sdkLoading, reload: reloadSdk } =
    useNaverMapsReady();

  const onAuthFailureRef = useLatest(onAuthFailure);

  const clearPolylines = () => {
    polylinesRef.current.forEach((line) => detachNaverOverlay(line));
    polylinesRef.current = [];
  };

  const drawRoutes = async (map: naver.maps.Map, selected: BariRoute) => {
    try {
      const maps = getNaverMaps();
      if (!maps) return;

      setLoadingRoute(true);
      setRouteError(null);
      clearPolylines();

      for (const route of bariRoutes) {
        const isSelected = route.id === selected.id;
        const path = isSelected
          ? await fetchRoutePath(route)
          : route.waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);

        const activeMaps = getNaverMaps();
        if (!activeMaps) return;

        const latLngs = path.map(([lat, lng]) => new activeMaps.LatLng(lat, lng));

        const polyline = new activeMaps.Polyline({
          map,
          path: latLngs,
          strokeColor: isSelected ? ROUTE_COLOR : MUTED_COLOR,
          strokeWeight: isSelected ? 5 : 2,
          strokeOpacity: isSelected ? 0.9 : 0.45,
        });

        polylinesRef.current.push(polyline);
      }

      const selectedPath = await fetchRoutePath(selected);
      const activeMaps = getNaverMaps();
      if (activeMaps && selectedPath.length > 0) {
        const bounds = new activeMaps.LatLngBounds();
        selectedPath.forEach(([lat, lng]) => {
          bounds.extend(new activeMaps.LatLng(lat, lng));
        });
        map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
      }

      triggerNaverMapResize(map);
    } catch {
      setRouteError("일부 코스 동선을 불러오지 못했습니다.");
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeNaverMapAuthFailure(() => {
      onAuthFailureRef.current?.();
    });
    return unsubscribe;
  }, [onAuthFailureRef]);

  useEffect(() => {
    if (!sdkReady) {
      if (sdkLoading) {
        setInitError(null);
      } else {
        setInitError("네이버 지도 SDK를 불러오지 못했습니다.");
      }
      return;
    }

    let active = true;

    const bootstrap = async () => {
      setInitError(null);
      setMapReady(false);
      clearPolylines();
      markersRef.current.forEach((marker) => detachNaverOverlay(marker));
      markersRef.current = [];
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
          if (!maps) {
            throw new Error("naver maps unavailable");
          }
          return {
            center: new maps.LatLng(36.3, 127.8),
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

      try {
        const maps = getNaverMaps();
        if (!maps) {
          throw new Error("naver maps unavailable");
        }

        markersRef.current = bariRoutes.map((route) => {
          const marker = new maps.Marker({
            map: result.map,
            position: new maps.LatLng(route.lat, route.lng),
            title: route.name,
          });

          addNaverMapListener(marker, "click", () => {
            setSelectedId(route.id);
          });

          return marker;
        });
      } catch {
        resetMapContainer(container);
        setInitError(getNaverMapInitErrorMessage("map"));
        return;
      }

      setMapReady(true);
    };

    void bootstrap();

    return () => {
      active = false;
      polylinesRef.current = [];
      markersRef.current = [];
      mapInstance.current = null;
      teardownNaverMapContainer(mapRef.current);
      setMapReady(false);
    };
  }, [sdkReady, bootAttempt]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !selectedRoute) return;

    void drawRoutes(mapInstance.current, selectedRoute);
  }, [mapReady, selectedRoute]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="relative h-[420px] overflow-hidden rounded-3xl border border-orange-100 bg-slate-100 shadow-sm">
          <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-green-700 shadow-sm ring-1 ring-green-100">
            네이버 지도
          </span>
          {(!mapReady || loadingRoute || sdkLoading) && !initError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-orange-50 text-sm text-slate-500">
              {loadingRoute
                ? "바리 코스 동선 불러오는 중..."
                : sdkLoading
                  ? "네이버 지도 SDK 불러오는 중..."
                  : "네이버 지도 불러오는 중..."}
            </div>
          )}
          {initError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-orange-50 p-6 text-center text-sm text-slate-600">
              <p>{initError}</p>
              <button
                type="button"
                onClick={() => {
                  reloadSdk();
                  setBootAttempt((value) => value + 1);
                }}
                className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600"
              >
                다시 불러오기
              </button>
            </div>
          )}
          <div
            ref={mapRef}
            className="naver-map-root h-[420px] w-full"
            style={{ height: 420 }}
          />
        </div>
        {routeError && (
          <p className="mt-2 text-center text-xs text-amber-700">{routeError}</p>
        )}
        <p className="mt-2 text-center text-xs text-slate-400">
          주황색 실선은 선택한 코스의 이륜차 통행 가능 경로입니다.
        </p>
      </div>

      <div className="min-w-0 space-y-3">
        <h2 className="text-lg font-bold text-slate-800">전국 바리 코스</h2>
        <p className="text-sm text-slate-500">
          코스를 선택하면 전국 지도에서 동선을 확인할 수 있습니다.
        </p>
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {bariRoutes.map((route) => {
            const isSelected = route.id === selectedId;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedId(route.id)}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  isSelected
                    ? "border-orange-300 bg-orange-50 ring-2 ring-orange-200"
                    : "border-orange-100 bg-white hover:border-orange-200"
                }`}
              >
                <p className="text-xs font-semibold text-orange-500">
                  {route.region} · {route.type}
                </p>
                <h3 className="mt-1 font-bold text-slate-800">{route.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {route.distance} · {route.duration}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
