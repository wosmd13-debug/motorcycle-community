"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MapFlyToTarget } from "@/components/services/map-types";
import type { ServiceMapViewMode } from "@/components/services/NaverServicePlacesMap";
import { bootstrapLeafletMap } from "@/lib/leaflet-map";
import {
  buildLiveFuelInfoElement,
  buildServiceInfoElement,
} from "@/lib/map-info-nav";
import {
  buildLiveFuelMarkerHtml,
  type LiveFuelStation,
} from "@/lib/opinet-service";
import type { RiderPlace } from "@/lib/places-data";
import { buildServiceMarkerHtml } from "@/lib/service-places";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

type OsmServicePlacesMapProps = {
  places: RiderPlace[];
  liveStations?: LiveFuelStation[];
  viewMode?: ServiceMapViewMode;
  flyToTarget?: MapFlyToTarget | null;
  userLocation?: { lat: number; lng: number } | null;
  mapFrameClassName?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCenterChange?: (center: { lat: number; lng: number }) => void;
};

export default function OsmServicePlacesMap({
  places,
  liveStations = [],
  viewMode = "curated",
  flyToTarget = null,
  userLocation = null,
  mapFrameClassName,
  selectedId,
  onSelect,
  onCenterChange,
}: OsmServicePlacesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const userInteractedRef = useRef(false);
  const initialFitDoneRef = useRef(false);
  const lastFlyToKeyRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const isLive = viewMode === "live";
  const hasData = isLive ? liveStations.length > 0 : places.length > 0;

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!isLive && places.length === 0) return;

    let cancelled = false;

    const bootstrap = async () => {
      if (!mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        clearMarkers();
      }

      userInteractedRef.current = false;
      initialFitDoneRef.current = false;
      lastFlyToKeyRef.current = null;

      const map = await bootstrapLeafletMap(L, mapRef.current, {
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: isLive ? 14 : places.length === 1 ? 12 : 7,
        zoomControl: true,
      });

      if (cancelled) {
        map.remove();
        return;
      }

      mapInstance.current = map;

      map.on("movestart", () => {
        userInteractedRef.current = true;
      });
      map.on("zoomstart", () => {
        userInteractedRef.current = true;
      });

      if (onCenterChange) {
        map.on("moveend", () => {
          const next = map.getCenter();
          onCenterChange({ lat: next.lat, lng: next.lng });
        });
      }

      setMapReady(true);
    };

    void bootstrap();

    return () => {
      cancelled = true;
      clearMarkers();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      setMapReady(false);
    };
  }, [clearMarkers, isLive, onCenterChange, places.length]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !map || !flyToTarget) return;
    if (lastFlyToKeyRef.current === flyToTarget.key) return;

    lastFlyToKeyRef.current = flyToTarget.key;
    map.panTo([flyToTarget.lat, flyToTarget.lng], {
      animate: true,
      duration: 0.35,
    });
    if (flyToTarget.zoom != null) {
      map.setZoom(flyToTarget.zoom, { animate: true });
    }
  }, [flyToTarget, mapReady]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !map) return;

    clearMarkers();

    if (isLive) {
      markersRef.current = liveStations.map((station) => {
        const marker = L.marker([station.lat, station.lng], {
          icon: L.divIcon({
            className: "",
            html: buildLiveFuelMarkerHtml(station, station.id === selectedId),
            iconSize: [72, 40],
            iconAnchor: [36, 40],
          }),
        }).addTo(map);

        const popupNode = buildLiveFuelInfoElement(station);
        marker.bindPopup(popupNode, { maxWidth: 280, minWidth: 200 });
        marker.on("click", () => {
          onSelect(station.id);
          map.panTo([station.lat, station.lng], { animate: true, duration: 0.35 });
          marker.openPopup();
        });

        return marker;
      });

      if (
        liveStations.length > 0 &&
        !initialFitDoneRef.current &&
        !userInteractedRef.current
      ) {
        initialFitDoneRef.current = true;
        const bounds = L.latLngBounds(
          liveStations.map(
            (station) => [station.lat, station.lng] as [number, number]
          )
        );
        if (userLocation) {
          bounds.extend([userLocation.lat, userLocation.lng]);
        }
        map.fitBounds(bounds, { padding: [48, 48], animate: true });
      }

      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }

      if (userLocation) {
        userLocationMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: L.divIcon({
            className: "",
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px rgba(37,99,235,0.35);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
          zIndexOffset: 1000,
        }).addTo(map);
      }
    } else {
      markersRef.current = places.map((place) => {
        const marker = L.marker([place.lat, place.lng], {
          icon: L.divIcon({
            className: "",
            html: buildServiceMarkerHtml(place, place.id === selectedId),
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
        }).addTo(map);

        marker.bindPopup(buildServiceInfoElement(place), {
          maxWidth: 280,
          minWidth: 200,
        });
        marker.on("click", () => {
          onSelect(place.id);
          map.panTo([place.lat, place.lng], { animate: true, duration: 0.35 });
          marker.openPopup();
        });

        return marker;
      });

      if (
        places.length > 0 &&
        !initialFitDoneRef.current &&
        !userInteractedRef.current
      ) {
        initialFitDoneRef.current = true;
        const bounds = L.latLngBounds(
          places.map((place) => [place.lat, place.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [48, 48], animate: true });
      }
    }
  }, [
    clearMarkers,
    isLive,
    liveStations,
    mapReady,
    onSelect,
    places,
    selectedId,
    userLocation,
  ]);

  useEffect(() => {
    if (!mapReady || selectedId == null || !mapInstance.current) return;

    if (isLive) {
      const index = liveStations.findIndex((station) => station.id === selectedId);
      const station = liveStations[index];
      const marker = markersRef.current[index];
      if (!station || !marker) return;

      mapInstance.current.panTo([station.lat, station.lng], {
        animate: true,
        duration: 0.35,
      });
      if (!userInteractedRef.current) {
        mapInstance.current.setZoom(15, { animate: true });
      }
      marker.setIcon(
        L.divIcon({
          className: "",
          html: buildLiveFuelMarkerHtml(station, true),
          iconSize: [72, 40],
          iconAnchor: [36, 40],
        })
      );
      marker.openPopup();
      return;
    }

    const index = places.findIndex((place) => place.id === selectedId);
    const place = places[index];
    const marker = markersRef.current[index];
    if (!place || !marker) return;

    mapInstance.current.panTo([place.lat, place.lng], {
      animate: true,
      duration: 0.35,
    });
    if (!userInteractedRef.current) {
      mapInstance.current.setZoom(13, { animate: true });
    }
    marker.setIcon(
      L.divIcon({
        className: "",
        html: buildServiceMarkerHtml(place, true),
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
    );
    marker.openPopup();
  }, [selectedId, mapReady, places, liveStations, isLive]);

  useEffect(() => {
    initialFitDoneRef.current = false;
  }, [isLive]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !map) return;

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [mapReady]);

  if (!isLive && places.length === 0) {
    return (
      <div className="portal-map-frame flex items-center justify-center rounded-3xl border border-dashed border-signature/20 bg-signature-light/40 text-sm text-slate-500">
        표시할 주유소가 없습니다.
      </div>
    );
  }

  return (
    <div
      className={`portal-map-frame relative overflow-hidden rounded-3xl border border-signature/20 bg-slate-100 shadow-sm ${mapFrameClassName ?? ""}`}
    >
      <span className="absolute right-3 top-3 z-[1000] rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
        {isLive ? "실시간 유가 · OpenStreetMap" : "OpenStreetMap"}
      </span>
      {isLive && mapReady && !hasData && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-2xl bg-white/95 px-4 py-3 text-center text-xs text-slate-600 shadow-sm ring-1 ring-slate-100">
          주변 주유소를 찾지 못했습니다. 지도를 이동하거나 새로고침해 보세요.
        </div>
      )}
      <div ref={mapRef} className="naver-map-root h-full min-h-[inherit] w-full" />
    </div>
  );
}
