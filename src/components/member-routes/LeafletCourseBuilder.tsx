"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildDirectionsQuery,
  pathToLatLngs,
  type DirectionsResult,
} from "@/lib/naver-directions";
import { bootstrapLeafletMap } from "@/lib/leaflet-map";
import type { RouteWaypoint } from "@/lib/routes-data";

type LeafletCourseBuilderProps = {
  waypoints: RouteWaypoint[];
  onChange: (waypoints: RouteWaypoint[]) => void;
};

const ROUTE_COLOR = "#22c55e";

async function fetchDirections(
  waypoints: RouteWaypoint[]
): Promise<DirectionsResult> {
  const query = buildDirectionsQuery(waypoints);
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

export default function LeafletCourseBuilder({
  waypoints,
  onChange,
}: LeafletCourseBuilderProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const onChangeRef = useRef(onChange);
  const waypointsRef = useRef(waypoints);
  const [mapReady, setMapReady] = useState(false);
  const [routeSummary, setRouteSummary] = useState<DirectionsResult["summary"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  onChangeRef.current = onChange;
  waypointsRef.current = waypoints;

  const renderOverlays = useCallback(async (map: L.Map, points: RouteWaypoint[]) => {
    layersRef.current?.clearLayers();
    setRouteSummary(null);
    setError(null);

    if (points.length === 0) return;

    let path: [number, number][] = points.map(
      (waypoint) => [waypoint.lat, waypoint.lng] as [number, number]
    );

    if (points.length >= 2) {
      try {
        const directions = await fetchDirections(points);
        setRouteSummary(directions.summary);
        path = pathToLatLngs(directions.path);
      } catch (err) {
        setError(err instanceof Error ? err.message : "경로 미리보기 실패");
      }
    }

    if (path.length > 1) {
      L.polyline(path, {
        color: ROUTE_COLOR,
        weight: 5,
        opacity: 0.9,
      }).addTo(layersRef.current!);
    }

    points.forEach((waypoint, index) => {
      const isStart = index === 0;
      const isEnd = index === points.length - 1 && points.length > 1;
      const label = isStart ? "출발" : isEnd ? "도착" : String(index + 1);

      L.circleMarker([waypoint.lat, waypoint.lng], {
        radius: 10,
        color: "#fff",
        weight: 2,
        fillColor: isStart ? "#16a34a" : isEnd ? "#dc2626" : ROUTE_COLOR,
        fillOpacity: 1,
      })
        .bindTooltip(`${label} · ${waypoint.name}`, { direction: "top" })
        .addTo(layersRef.current!);
    });

    if (path.length > 0) {
      map.fitBounds(L.latLngBounds(path), { padding: [40, 40] });
    } else {
      map.setView([points[0].lat, points[0].lng], 12);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    void bootstrapLeafletMap(L, mapRef.current, {
      center: [36.5, 127.8],
      zoom: 7,
    }).then((map) => {
      if (cancelled) {
        map.remove();
        return;
      }

      mapInstance.current = map;
      layersRef.current = L.layerGroup().addTo(map);
      setMapReady(true);

      map.on("click", (event) => {
        const current = waypointsRef.current;
        const next: RouteWaypoint = {
          name:
            current.length === 0
              ? "출발지"
              : `경유지 ${current.length}`,
          lat: Number(event.latlng.lat.toFixed(6)),
          lng: Number(event.latlng.lng.toFixed(6)),
        };
        onChangeRef.current([...current, next]);
      });
    });

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      layersRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !layersRef.current) return;
    void renderOverlays(mapInstance.current, waypoints);
  }, [mapReady, renderOverlays, waypoints]);

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="h-[420px] w-full overflow-hidden rounded-3xl border border-signature/20 bg-signature-light"
      />
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
