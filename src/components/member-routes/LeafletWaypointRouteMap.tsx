"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildDirectionsQuery,
  normalizeDirectionsError,
  pathToLatLngs,
  type DirectionsResult,
} from "@/lib/naver-directions";
import { bootstrapLeafletMap } from "@/lib/leaflet-map";
import type { RouteWaypoint } from "@/lib/routes-data";

type LeafletWaypointRouteMapProps = {
  waypoints: RouteWaypoint[];
  mapKey: string;
};

const ROUTE_COLOR = "#22c55e";
const DEFAULT_CENTER: [number, number] = [36.5, 127.8];

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

export default function LeafletWaypointRouteMap({
  waypoints,
  mapKey,
}: LeafletWaypointRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const renderGenerationRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState<
    DirectionsResult["summary"] | null
  >(null);
  const [useWaypointFallback, setUseWaypointFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderRoute = useCallback(
    async (map: L.Map, generation: number) => {
      if (mapInstance.current !== map || waypoints.length === 0) return;

      setRouteLoading(true);
      setRouteSummary(null);
      setError(null);
      setUseWaypointFallback(false);
      layersRef.current?.clearLayers();

      let path = waypoints.map(
        (waypoint) => [waypoint.lat, waypoint.lng] as [number, number]
      );

      try {
        if (waypoints.length >= 2) {
          try {
            const directions = await fetchDirections(waypoints);
            if (
              renderGenerationRef.current !== generation ||
              mapInstance.current !== map
            ) {
              return;
            }

            setRouteSummary(directions.summary);
            path = pathToLatLngs(directions.path);
          } catch (err) {
            if (
              renderGenerationRef.current !== generation ||
              mapInstance.current !== map
            ) {
              return;
            }

            setUseWaypointFallback(true);
            path = waypoints.map(
              (waypoint) => [waypoint.lat, waypoint.lng] as [number, number]
            );
            setError(
              normalizeDirectionsError(
                err instanceof Error ? err.message : "경로를 불러오지 못했습니다."
              )
            );
          }
        }

        if (
          renderGenerationRef.current !== generation ||
          mapInstance.current !== map
        ) {
          return;
        }

        if (path.length > 1) {
          L.polyline(path, {
            color: ROUTE_COLOR,
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(layersRef.current!);
        }

        waypoints.forEach((waypoint, index) => {
          L.circleMarker([waypoint.lat, waypoint.lng], {
            radius: 8,
            color: "#fff",
            weight: 2,
            fillColor: ROUTE_COLOR,
            fillOpacity: 1,
          })
            .bindTooltip(`${index + 1}. ${waypoint.name}`)
            .addTo(layersRef.current!);
        });

        const boundsPoints: [number, number][] = [
          ...path,
          ...waypoints.map(
            (waypoint) => [waypoint.lat, waypoint.lng] as [number, number]
          ),
        ];

        if (boundsPoints.length > 0) {
          map.fitBounds(L.latLngBounds(boundsPoints), { padding: [48, 48] });
        } else {
          map.setView(DEFAULT_CENTER, 10);
        }

        requestAnimationFrame(() => map.invalidateSize());
        window.setTimeout(() => map.invalidateSize(), 300);
      } finally {
        if (renderGenerationRef.current === generation) {
          setRouteLoading(false);
        }
      }
    },
    [waypoints]
  );

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    const bootstrap = async () => {
      const map = await bootstrapLeafletMap(L, mapRef.current!, {
        center: DEFAULT_CENTER,
        zoom: 10,
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
      renderGenerationRef.current += 1;
      mapInstance.current?.remove();
      mapInstance.current = null;
      layersRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const generation = ++renderGenerationRef.current;
    void renderRoute(mapInstance.current, generation);
  }, [mapKey, mapReady, renderRoute]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const handleResize = () => {
      mapInstance.current?.invalidateSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mapReady]);

  return (
    <div className="space-y-2">
      <div className="relative h-[320px] overflow-hidden rounded-3xl border border-signature/20 bg-slate-100 shadow-sm lg:h-[420px]">
        <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
          OpenStreetMap
        </span>
        {(!mapReady || routeLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-signature-light text-sm text-slate-500">
            {routeLoading ? "오토바이 경로 계산 중..." : "지도 불러오는 중..."}
          </div>
        )}
        <div ref={mapRef} className="h-[320px] w-full lg:h-[420px]" />
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
      {error && routeSummary && (
        <p className="text-center text-xs text-amber-700">{error}</p>
      )}
    </div>
  );
}
