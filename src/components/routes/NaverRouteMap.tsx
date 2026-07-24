"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BariRoute } from "@/lib/routes-data";
import {
  buildDirectionsQuery,
  isDirectionsConfigError,
  normalizeDirectionsError,
  pathToLatLngs,
  type DirectionsResult,
} from "@/lib/naver-directions";
import {
  addNaverMapListener,
  buildServiceMapOptions,
  checkNaverMapsReady,
  detachNaverOverlay,
  getNaverMapInitErrorMessage,
  getNaverMaps,
  isNaverMapAuthFailed,
  prepareNaverMap,
  resetMapContainer,
  safeCloseInfoWindow,
  subscribeNaverMapAuthFailure,
  teardownNaverMapContainer,
  triggerNaverMapResize,
  waitForElementRef,
} from "@/lib/naver-maps";
import { useNaverMapClientId, useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import NaverMapSetupGuide from "@/components/map/NaverMapSetupGuide";
import { buildPlaceMapPopupHtml } from "@/lib/naver-booking";
import { escapeHtml } from "@/lib/html-escape";
import { getPlacesForRoute, placeCategoryLabels, placeCategoryMarker } from "@/lib/places-data";
import { useLatest } from "@/lib/use-latest";

type NaverRouteMapProps = {
  route: BariRoute;
  onAuthFailure?: () => void;
};

const ROUTE_COLOR = "#22c55e";

function buildPopup(name: string, note?: string) {
  return `
    <div style="padding:10px 12px;font-family:sans-serif;min-width:140px;">
      <strong style="font-size:13px;color:#1e293b;">${escapeHtml(name)}</strong>
      ${note ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">${escapeHtml(note)}</p>` : ""}
    </div>
  `;
}

function buildPlacePopup(
  name: string,
  category: string,
  offer?: string,
  naverBookingUrl?: string
) {
  return buildPlaceMapPopupHtml({
    name,
    category: "accommodation",
    categoryLabel: category,
    offer,
    naverBookingUrl,
  });
}

function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}시간 ${rest}분` : `${hours}시간`;
}

function formatDistance(meters: number) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

async function fetchMotorcycleRoute(
  route: BariRoute
): Promise<DirectionsResult> {
  const query = buildDirectionsQuery(route.waypoints);
  if (!query) {
    throw new Error("경유지가 부족합니다.");
  }

  const params = new URLSearchParams({ start: query.start, goal: query.goal });
  if (query.waypoints) {
    params.set("waypoints", query.waypoints);
  }

  const response = await fetch(`/api/directions?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      normalizeDirectionsError(data.error ?? "경로를 불러오지 못했습니다.")
    );
  }

  return data as DirectionsResult;
}

export default function NaverRouteMap({
  route,
  onAuthFailure,
}: NaverRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const polylineRef = useRef<naver.maps.Polyline | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState<
    DirectionsResult["summary"] | null
  >(null);
  const [useWaypointFallback, setUseWaypointFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const onAuthFailureRef = useLatest(onAuthFailure);
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
    safeCloseInfoWindow(infoWindowRef.current);
  }, []);

  const openInfo = useCallback(
    (content: string, marker: naver.maps.Marker, map: naver.maps.Map) => {
      infoWindowRef.current?.setContent(content);
      infoWindowRef.current?.open(map, marker);
    },
    []
  );

  const renderRoute = useCallback(
    async (map: naver.maps.Map) => {
      try {
        const maps = getNaverMaps();
        if (!maps || route.waypoints.length === 0) return;

        clearOverlays();
        setRouteLoading(true);
        setRouteSummary(null);
        setError(null);

        const places = getPlacesForRoute(route.id);
        let pathLatLngs: naver.maps.LatLng[] = [];

        try {
          const directions = await fetchMotorcycleRoute(route);
          const mapsAfterFetch = getNaverMaps();
          if (!mapsAfterFetch) return;

          setRouteSummary(directions.summary);
          setUseWaypointFallback(false);
          pathLatLngs = pathToLatLngs(directions.path).map(
            ([lat, lng]) => new mapsAfterFetch.LatLng(lat, lng)
          );
        } catch (err) {
          const mapsAfterError = getNaverMaps();
          if (!mapsAfterError) return;

          const message = normalizeDirectionsError(
            err instanceof Error ? err.message : "경로를 불러오지 못했습니다."
          );
          setError(message);
          setUseWaypointFallback(true);
          pathLatLngs = route.waypoints.map(
            (wp) => new mapsAfterError.LatLng(wp.lat, wp.lng)
          );
        }

        const activeMaps = getNaverMaps();
        if (!activeMaps) return;

        if (pathLatLngs.length > 0) {
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

        route.waypoints.forEach((wp) => {
          const position = new activeMaps.LatLng(wp.lat, wp.lng);
          const marker = new activeMaps.Marker({
            map,
            position,
            title: wp.name,
            icon: {
              content: `<div style="width:14px;height:14px;border-radius:9999px;background:${ROUTE_COLOR};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);"></div>`,
              size: new activeMaps.Size(14, 14),
              anchor: new activeMaps.Point(7, 7),
            },
          });

          addNaverMapListener(marker, "click", () => {
            openInfo(buildPopup(wp.name, wp.note), marker, map);
          });

          markersRef.current.push(marker);
        });

        places.forEach((place) => {
          const isPremium = place.promotion?.tier === "premium";
          const position = new activeMaps.LatLng(place.lat, place.lng);
          const marker = new activeMaps.Marker({
            map,
            position,
            title: place.name,
            icon: {
              content: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${isPremium ? "#f59e0b" : "#fff"};border:2px solid ${isPremium ? "#d97706" : ROUTE_COLOR};box-shadow:0 2px 8px rgba(0,0,0,.15);font-size:12px;font-weight:700;color:${isPremium ? "#fff" : ROUTE_COLOR};">${placeCategoryMarker[place.category]}</div>`,
              size: new activeMaps.Size(32, 32),
              anchor: new activeMaps.Point(16, 16),
            },
          });

          addNaverMapListener(marker, "click", () => {
            openInfo(
              buildPlacePopup(
                place.name,
                placeCategoryLabels[place.category as keyof typeof placeCategoryLabels] ?? place.category,
                place.promotion?.headline,
                place.naverBookingUrl
              ),
              marker,
              map
            );
          });

          markersRef.current.push(marker);
        });

        const bounds = new activeMaps.LatLngBounds();
        pathLatLngs.forEach((point) => bounds.extend(point));
        places.forEach((place) => {
          bounds.extend(new activeMaps.LatLng(place.lat, place.lng));
        });

        if (pathLatLngs.length > 0) {
          map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
        } else {
          map.panTo(new activeMaps.LatLng(route.lat, route.lng));
          map.setZoom(9);
        }

        triggerNaverMapResize(map);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "경로를 지도에 표시하지 못했습니다."
        );
      } finally {
        setRouteLoading(false);
      }
    },
    [route, clearOverlays, openInfo]
  );

  const authCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    authCleanupRef.current = subscribeNaverMapAuthFailure(() => {
      onAuthFailureRef.current?.();
    });
    return () => {
      authCleanupRef.current?.();
      authCleanupRef.current = null;
    };
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
          return buildServiceMapOptions(maps, { lat: route.lat, lng: route.lng }, 9);
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
        if (!maps) throw new Error("naver maps unavailable");

        infoWindowRef.current = new maps.InfoWindow({
          borderWidth: 0,
          backgroundColor: "transparent",
          anchorSize: new maps.Size(0, 0),
          anchorSkew: false,
          pixelOffset: new maps.Point(0, -10),
        });
      } catch {
        resetMapContainer(container);
        setInitError(getNaverMapInitErrorMessage("map"));
        return;
      }

      setMapReady(true);
      triggerNaverMapResize(result.map);
    };

    void bootstrap();

    return () => {
      active = false;
      markersRef.current = [];
      polylineRef.current = null;
      infoWindowRef.current = null;
      mapInstance.current = null;
      teardownNaverMapContainer(mapRef.current);
      setMapReady(false);
    };
  }, [clearOverlays, clientId, route.lat, route.lng, sdkReady, bootAttempt]);

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
    void renderRoute(mapInstance.current);
  }, [mapReady, renderRoute]);

  return (
    <div className="space-y-2">
      {error && isDirectionsConfigError(error) && (
        <NaverMapSetupGuide />
      )}
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
        {mapReady && routeLoading && (
          <div className="absolute left-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            오토바이 경로 계산 중...
          </div>
        )}
        <div
          ref={mapRef}
          className="naver-map-root h-full min-h-[inherit] w-full"
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
