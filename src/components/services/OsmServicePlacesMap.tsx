"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { bootstrapLeafletMap } from "@/lib/leaflet-map";
import {
  buildLiveFuelInfoContent,
  buildLiveFuelMarkerHtml,
  type LiveFuelStation,
} from "@/lib/opinet-service";
import type { RiderPlace } from "@/lib/places-data";
import {
  buildServiceInfoContent,
  buildServiceMarkerHtml,
  getServicePlaceCenter,
} from "@/lib/service-places";
import type { ServiceMapViewMode } from "@/components/services/NaverServicePlacesMap";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

type OsmServicePlacesMapProps = {
  places: RiderPlace[];
  liveStations?: LiveFuelStation[];
  viewMode?: ServiceMapViewMode;
  mapCenter?: { lat: number; lng: number };
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCenterChange?: (center: { lat: number; lng: number }) => void;
};

export default function OsmServicePlacesMap({
  places,
  liveStations = [],
  viewMode = "curated",
  mapCenter,
  selectedId,
  onSelect,
  onCenterChange,
}: OsmServicePlacesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const isLive = viewMode === "live";
  const hasData = isLive ? liveStations.length > 0 : places.length > 0;

  const resolveCenter = useCallback(() => {
    if (mapCenter) return mapCenter;
    if (isLive && liveStations.length > 0) {
      return { lat: liveStations[0].lat, lng: liveStations[0].lng };
    }
    if (places.length > 0) return getServicePlaceCenter(places);
    return DEFAULT_CENTER;
  }, [isLive, liveStations, mapCenter, places]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, []);

  const openCuratedPopup = useCallback((place: RiderPlace, marker: L.Marker) => {
    marker.bindPopup(buildServiceInfoContent(place)).openPopup();
  }, []);

  const openLivePopup = useCallback((station: LiveFuelStation, marker: L.Marker) => {
    marker.bindPopup(buildLiveFuelInfoContent(station)).openPopup();
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

      const center = resolveCenter();
      const map = await bootstrapLeafletMap(L, mapRef.current, {
        center: [center.lat, center.lng],
        zoom: isLive ? 14 : places.length === 1 ? 12 : 7,
        zoomControl: true,
      });

      if (cancelled) {
        map.remove();
        return;
      }

      mapInstance.current = map;

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
  }, [clearMarkers, isLive, onCenterChange, places.length, resolveCenter]);

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

        marker.bindPopup(buildLiveFuelInfoContent(station));
        marker.on("click", () => {
          onSelect(station.id);
          map.panTo([station.lat, station.lng]);
          marker.openPopup();
        });

        return marker;
      });

      if (liveStations.length > 0) {
        const bounds = L.latLngBounds(
          liveStations.map((station) => [station.lat, station.lng] as [number, number])
        );
        if (mapCenter) {
          bounds.extend([mapCenter.lat, mapCenter.lng]);
        }
        map.fitBounds(bounds, { padding: [48, 48] });
      } else if (mapCenter) {
        map.panTo([mapCenter.lat, mapCenter.lng]);
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

        marker.bindPopup(buildServiceInfoContent(place));
        marker.on("click", () => {
          onSelect(place.id);
          map.panTo([place.lat, place.lng]);
          marker.openPopup();
        });

        return marker;
      });
    }
  }, [
    clearMarkers,
    isLive,
    liveStations,
    mapCenter,
    mapReady,
    onSelect,
    places,
    selectedId,
  ]);

  useEffect(() => {
    if (!mapReady || selectedId == null || !mapInstance.current) return;

    if (isLive) {
      const index = liveStations.findIndex((station) => station.id === selectedId);
      const station = liveStations[index];
      const marker = markersRef.current[index];
      if (!station || !marker) return;

      mapInstance.current.panTo([station.lat, station.lng]);
      mapInstance.current.setZoom(15);
      marker.setIcon(
        L.divIcon({
          className: "",
          html: buildLiveFuelMarkerHtml(station, true),
          iconSize: [72, 40],
          iconAnchor: [36, 40],
        })
      );
      openLivePopup(station, marker);
      return;
    }

    const index = places.findIndex((place) => place.id === selectedId);
    const place = places[index];
    const marker = markersRef.current[index];
    if (!place || !marker) return;

    mapInstance.current.panTo([place.lat, place.lng]);
    mapInstance.current.setZoom(13);
    marker.setIcon(
      L.divIcon({
        className: "",
        html: buildServiceMarkerHtml(place, true),
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
    );
    openCuratedPopup(place, marker);
  }, [
    selectedId,
    mapReady,
    places,
    liveStations,
    isLive,
    openCuratedPopup,
    openLivePopup,
  ]);

  if (!isLive && places.length === 0) {
    return (
      <div className="portal-map-frame flex items-center justify-center rounded-3xl border border-dashed border-signature/20 bg-signature-light/40 text-sm text-slate-500">
        표시할 주유소가 없습니다.
      </div>
    );
  }

  return (
    <div className="portal-map-frame relative overflow-hidden rounded-3xl border border-signature/20 bg-slate-100 shadow-sm">
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
