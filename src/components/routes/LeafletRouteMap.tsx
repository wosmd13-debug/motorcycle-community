"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BariRoute } from "@/lib/routes-data";
import {
  buildDirectionsQuery,
  pathToLatLngs,
  type DirectionsResult,
} from "@/lib/naver-directions";
import { getPlacesForRoute, placeCategoryEmoji } from "@/lib/places-data";
import { bootstrapLeafletMap } from "@/lib/leaflet-map";

type LeafletRouteMapProps = {
  route: BariRoute;
};

const ROUTE_COLOR = "#f97316";

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
    throw new Error(data.error ?? "경로를 불러오지 못했습니다.");
  }

  return data as DirectionsResult;
}

export default function LeafletRouteMap({ route }: LeafletRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState<
    DirectionsResult["summary"] | null
  >(null);
  const [useWaypointFallback, setUseWaypointFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderRoute = useCallback(
    async (map: L.Map) => {
      if (route.waypoints.length === 0) return;

      setRouteLoading(true);
      setRouteSummary(null);
      setError(null);
      layersRef.current?.clearLayers();

      const places = getPlacesForRoute(route.id);
      let path: [number, number][] = [];

      try {
        const directions = await fetchMotorcycleRoute(route);
        setRouteSummary(directions.summary);
        setUseWaypointFallback(false);
        path = pathToLatLngs(directions.path);
      } catch (err) {
        setUseWaypointFallback(true);
        path = route.waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);
        setError(
          err instanceof Error ? err.message : "경로를 불러오지 못했습니다."
        );
      } finally {
        setRouteLoading(false);
      }

      if (path.length > 0) {
        L.polyline(path, {
          color: ROUTE_COLOR,
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(layersRef.current!);
      }

      route.waypoints.forEach((wp) => {
        L.circleMarker([wp.lat, wp.lng], {
          radius: 7,
          color: "#fff",
          weight: 2,
          fillColor: ROUTE_COLOR,
          fillOpacity: 1,
        })
          .bindPopup(
            `<strong>${wp.name}</strong>${wp.note ? `<br/><span style="color:#64748b;font-size:12px">${wp.note}</span>` : ""}`
          )
          .addTo(layersRef.current!);
      });

      places.forEach((place) => {
        const isPremium = place.promotion?.tier === "premium";
        L.marker([place.lat, place.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${isPremium ? "#f59e0b" : "#fff"};border:2px solid ${isPremium ? "#d97706" : ROUTE_COLOR};box-shadow:0 2px 8px rgba(0,0,0,.15);font-size:16px;">${placeCategoryEmoji[place.category]}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        })
          .bindPopup(
            `<strong>${place.name}</strong><br/><span style="color:#64748b;font-size:12px">${place.category === "cafe" ? "라이더 카페" : place.category}</span>`
          )
          .addTo(layersRef.current!);
      });

      const boundsPoints: [number, number][] = [
        ...path,
        ...route.waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]),
        ...places.map((place) => [place.lat, place.lng] as [number, number]),
      ];

      if (boundsPoints.length > 0) {
        map.fitBounds(L.latLngBounds(boundsPoints), { padding: [48, 48] });
      } else {
        map.setView([route.lat, route.lng], 9);
      }

      requestAnimationFrame(() => map.invalidateSize());
      window.setTimeout(() => map.invalidateSize(), 300);
    },
    [route]
  );

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    const bootstrap = async () => {
      if (!mapRef.current) return;

      const map = await bootstrapLeafletMap(L, mapRef.current, {
        center: [route.lat, route.lng],
        zoom: 9,
        zoomControl: true,
      });

      if (cancelled) {
        map.remove();
        return;
      }

      mapInstance.current = map;
      layersRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    };

    void bootstrap();

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      layersRef.current = null;
      setMapReady(false);
    };
  }, [route.lat, route.lng]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    void renderRoute(mapInstance.current);
  }, [mapReady, renderRoute]);

  return (
    <div className="space-y-2">
      <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-orange-100 bg-slate-100 shadow-sm lg:min-h-[420px]">
        <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
          OpenStreetMap
        </span>
        {(!mapReady || routeLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-orange-50 text-sm text-slate-500">
            {routeLoading ? "오토바이 경로 계산 중..." : "지도 불러오는 중..."}
          </div>
        )}
        <div ref={mapRef} className="h-[320px] w-full lg:h-[420px]" />
      </div>

      {routeSummary && (
        <p className="text-center text-xs text-slate-500">
          🏍️ 이륜차 통행 가능 경로 · 약{" "}
          <strong className="text-orange-600">
            {formatDistance(routeSummary.distance)}
          </strong>
          {" · "}
          <strong className="text-orange-600">
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
      {error && routeSummary && (
        <p className="text-center text-xs text-amber-700">{error}</p>
      )}
    </div>
  );
}
