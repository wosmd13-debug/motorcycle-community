"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import {
  buildDirectionsQuery,
  pathToLatLngs,
  type DirectionsResult,
} from "@/lib/naver-directions";
import { bariRoutes, type BariRoute } from "@/lib/routes-data";
import { bootstrapLeafletMap } from "@/lib/leaflet-map";

const ROUTE_COLOR = "#f97316";
const MUTED_COLOR = "#94a3b8";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

export default function NationalBariMapSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const [selectedId, setSelectedId] = useState(bariRoutes[0]?.id ?? 1);
  const [mapReady, setMapReady] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const selectedRoute =
    bariRoutes.find((route) => route.id === selectedId) ?? bariRoutes[0];

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    const bootstrap = async () => {
      if (!mapRef.current) return;

      const map = await bootstrapLeafletMap(L, mapRef.current, {
        center: [36.3, 127.8],
        zoom: 7,
        zoomControl: true,
      });

      if (cancelled) {
        map.remove();
        return;
      }

      mapInstance.current = map;
      layersRef.current = L.layerGroup().addTo(map);

      bariRoutes.forEach((route) => {
        const marker = L.marker([route.lat, route.lng], { icon: markerIcon }).addTo(
          map
        );
        marker.bindPopup(
          `<strong>${route.name}</strong><br/>${route.region} · ${route.distance}`
        );
        marker.on("click", () => setSelectedId(route.id));
      });

      if (!cancelled) setMapReady(true);
    };

    void bootstrap();

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      layersRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !layersRef.current || !selectedRoute) {
      return;
    }

    let cancelled = false;

    const drawRoutes = async () => {
      setLoadingRoute(true);
      setRouteError(null);
      layersRef.current?.clearLayers();

      for (const route of bariRoutes) {
        if (cancelled) return;

        const isSelected = route.id === selectedRoute.id;
        const path = isSelected
          ? await fetchRoutePath(route)
          : route.waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);

        L.polyline(path, {
          color: isSelected ? ROUTE_COLOR : MUTED_COLOR,
          weight: isSelected ? 5 : 2,
          opacity: isSelected ? 0.9 : 0.45,
          dashArray: isSelected ? undefined : "6 8",
        }).addTo(layersRef.current!);
      }

      if (cancelled || !mapInstance.current) return;

      const selectedPath = await fetchRoutePath(selectedRoute);
      if (selectedPath.length > 0) {
        mapInstance.current.fitBounds(L.latLngBounds(selectedPath), {
          padding: [48, 48],
        });
      }

      setLoadingRoute(false);
    };

    void drawRoutes().catch(() => {
      if (!cancelled) {
        setRouteError("일부 코스 동선을 불러오지 못했습니다.");
        setLoadingRoute(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mapReady, selectedRoute]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-orange-100 bg-slate-100 shadow-sm">
          <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
            OpenStreetMap
          </span>
          {(!mapReady || loadingRoute) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-orange-50 text-sm text-slate-500">
              {loadingRoute ? "바리 코스 동선 불러오는 중..." : "지도 불러오는 중..."}
            </div>
          )}
          <div ref={mapRef} className="h-[420px] w-full" />
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
