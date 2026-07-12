"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import {
  buildDirectionsQuery,
  pathToLatLngs,
  type DirectionsResult,
} from "@/lib/naver-directions";
import type { BariRoute } from "@/lib/routes-data";
import { bootstrapLeafletMap } from "@/lib/leaflet-map";
import type { MemberRoute } from "@/lib/member-route";
import { buildMemberMapHref } from "@/lib/route-links";
import RoutePlacesPanel from "@/components/map/RoutePlacesPanel";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import { buildPlaceMapPopupHtml } from "@/lib/naver-booking";
import {
  getPlacesForRoute,
  placeCategoryLabels,
  placeCategoryMarker,
} from "@/lib/places-data";

const ROUTE_COLOR = "#22c55e";
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

export default function NationalBariMapSection({
  initialRouteId,
  bariRoutes,
  memberRoutes = [],
  highlightPlaceId: initialHighlightPlaceId,
}: {
  initialRouteId?: number;
  bariRoutes: BariRoute[];
  memberRoutes?: MemberRoute[];
  highlightPlaceId?: string;
}) {
  const defaultRouteId =
    initialRouteId && bariRoutes.some((route) => route.id === initialRouteId)
      ? initialRouteId
      : (bariRoutes[0]?.id ?? 1);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const [selectedId, setSelectedId] = useState(defaultRouteId);
  const [highlightPlaceId, setHighlightPlaceId] = useState(
    initialHighlightPlaceId ?? ""
  );
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

      const selectedPath = await fetchRoutePath(selectedRoute);
      const places = getPlacesForRoute(selectedRoute.id);

      places.forEach((place) => {
        const isPremium = place.promotion?.tier === "premium";
        const isHighlighted = place.id === highlightPlaceId;

        const marker = L.marker([place.lat, place.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${isPremium ? "#f59e0b" : "#fff"};border:2px solid ${isHighlighted ? "#dc2626" : isPremium ? "#d97706" : ROUTE_COLOR};box-shadow:0 2px 8px rgba(0,0,0,.15);font-size:12px;font-weight:700;color:${isPremium ? "#fff" : ROUTE_COLOR};">${placeCategoryMarker[place.category]}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        })
          .bindPopup(
            buildPlaceMapPopupHtml({
              name: place.name,
              category: place.category,
              categoryLabel: placeCategoryLabels[place.category],
              naverBookingUrl: place.naverBookingUrl,
            })
          )
          .addTo(layersRef.current!);

        if (isHighlighted) {
          marker.openPopup();
        }
      });

      if (cancelled || !mapInstance.current) return;

      const boundsPoints: [number, number][] = [
        ...selectedPath,
        ...places.map((place) => [place.lat, place.lng] as [number, number]),
      ];

      if (boundsPoints.length > 0) {
        mapInstance.current.fitBounds(L.latLngBounds(boundsPoints), {
          padding: [48, 48],
        });
      } else if (selectedPath.length > 0) {
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
  }, [mapReady, selectedRoute, highlightPlaceId]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-signature/20 bg-slate-100 shadow-sm">
          <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
            OpenStreetMap
          </span>
          {(!mapReady || loadingRoute) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-signature-light text-sm text-slate-500">
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
