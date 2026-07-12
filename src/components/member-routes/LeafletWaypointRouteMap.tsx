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

type LeafletWaypointRouteMapProps = {
  waypoints: RouteWaypoint[];
  mapKey: string;
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

export default function LeafletWaypointRouteMap({
  waypoints,
  mapKey,
}: LeafletWaypointRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const renderRoute = useCallback(async (map: L.Map) => {
    if (waypoints.length === 0) return;
    layersRef.current?.clearLayers();

    let path = waypoints.map(
      (waypoint) => [waypoint.lat, waypoint.lng] as [number, number]
    );

    if (waypoints.length >= 2) {
      try {
        const directions = await fetchDirections(waypoints);
        path = pathToLatLngs(directions.path);
      } catch {
        // straight line fallback
      }
    }

    if (path.length > 1) {
      L.polyline(path, { color: ROUTE_COLOR, weight: 5, opacity: 0.9 }).addTo(
        layersRef.current!
      );
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

    map.fitBounds(L.latLngBounds(path), { padding: [30, 30] });
  }, [waypoints]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    void bootstrapLeafletMap(L, mapRef.current, {
      center: [waypoints[0]?.lat ?? 36.5, waypoints[0]?.lng ?? 127.8],
      zoom: 10,
    }).then((map) => {
      if (cancelled) {
        map.remove();
        return;
      }
      mapInstance.current = map;
      layersRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      layersRef.current = null;
      setMapReady(false);
    };
  }, [mapKey, waypoints]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    void renderRoute(mapInstance.current);
  }, [mapReady, renderRoute]);

  return (
    <div
      ref={mapRef}
      className="min-h-[320px] w-full overflow-hidden rounded-3xl border border-signature/20 bg-signature-light lg:min-h-[420px]"
    />
  );
}
