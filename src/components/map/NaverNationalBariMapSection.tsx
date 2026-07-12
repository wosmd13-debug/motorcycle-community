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
import type { MemberRoute } from "@/lib/member-route";
import { buildMemberMapHref } from "@/lib/route-links";
import type { BariRoute } from "@/lib/routes-data";
import RoutePlacesPanel from "@/components/map/RoutePlacesPanel";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  getPlacesForRoute,
  placeCategoryLabels,
  placeCategoryMarker,
} from "@/lib/places-data";

const ROUTE_COLOR = "#22c55e";
const MUTED_COLOR = "#94a3b8";

type NaverNationalBariMapSectionProps = {
  initialRouteId?: number;
  bariRoutes: BariRoute[];
  memberRoutes?: MemberRoute[];
  highlightPlaceId?: string;
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
  initialRouteId,
  bariRoutes,
  memberRoutes = [],
  highlightPlaceId: initialHighlightPlaceId,
  onAuthFailure,
}: NaverNationalBariMapSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const polylinesRef = useRef<naver.maps.Polyline[]>([]);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const placeMarkersRef = useRef<naver.maps.Marker[]>([]);

  const defaultRouteId =
    initialRouteId && bariRoutes.some((route) => route.id === initialRouteId)
      ? initialRouteId
      : (bariRoutes[0]?.id ?? 1);

  const [selectedId, setSelectedId] = useState(defaultRouteId);
  const [highlightPlaceId, setHighlightPlaceId] = useState(
    initialHighlightPlaceId ?? ""
  );
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

  const clearPlaceMarkers = () => {
    placeMarkersRef.current.forEach((marker) => detachNaverOverlay(marker));
    placeMarkersRef.current = [];
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

        const places = getPlacesForRoute(selected.id);
        clearPlaceMarkers();

        places.forEach((place) => {
          const isPremium = place.promotion?.tier === "premium";
          const isHighlighted = place.id === highlightPlaceId;
          const marker = new activeMaps.Marker({
            map,
            position: new activeMaps.LatLng(place.lat, place.lng),
            title: place.name,
            icon: {
              content: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${isPremium ? "#f59e0b" : "#fff"};border:2px solid ${isHighlighted ? "#dc2626" : isPremium ? "#d97706" : ROUTE_COLOR};box-shadow:0 2px 8px rgba(0,0,0,.15);font-size:12px;font-weight:700;color:${isPremium ? "#fff" : ROUTE_COLOR};">${placeCategoryMarker[place.category]}</div>`,
              size: new activeMaps.Size(32, 32),
              anchor: new activeMaps.Point(16, 16),
            },
          });
          placeMarkersRef.current.push(marker);
          bounds.extend(new activeMaps.LatLng(place.lat, place.lng));
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
  }, [mapReady, selectedRoute, highlightPlaceId]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="relative h-[420px] overflow-hidden rounded-3xl border border-signature/20 bg-slate-100 shadow-sm">
          <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-green-700 shadow-sm ring-1 ring-green-100">
            네이버 지도
          </span>
          {(!mapReady || loadingRoute || sdkLoading) && !initError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-signature-light text-sm text-slate-500">
              {loadingRoute
                ? "바리 코스 동선 불러오는 중..."
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
                    ? "border-signature/40 bg-signature-light ring-2 ring-signature/30"
                    : "border-signature/20 bg-white hover:border-signature/30"
                }`}
              >
                <p className="text-xs font-semibold text-signature-dark">
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

        {selectedRoute && (
          <RoutePlacesPanel
            routeId={selectedRoute.id}
            highlightPlaceId={highlightPlaceId}
            onHighlightPlace={setHighlightPlaceId}
          />
        )}

        {memberRoutes.length > 0 && (
          <div className="space-y-2 border-t border-signature/20 pt-4">
            <h3 className="text-sm font-bold text-slate-800">회원 등록 바리코스</h3>
            <p className="text-xs text-slate-500">
              회원이 등록한 동선은 지도에서 바로 확인하고 내비로 연결할 수 있습니다.
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {memberRoutes.slice(0, 8).map((route) => (
                <a
                  key={route.id}
                  href={buildMemberMapHref(route.id)}
                  className="block rounded-2xl border border-signature/20 bg-white p-3 transition hover:border-signature/30 hover:bg-signature-light/60"
                >
                  <p className="text-[11px] font-semibold text-signature-dark">
                    {route.region} · {route.type}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{route.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    <span>by</span>
                    <AuthorWithGrade
                      author={route.author}
                      nicknameClassName="text-xs text-slate-500"
                      className="inline-flex max-w-full flex-wrap items-center gap-1"
                    />
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
