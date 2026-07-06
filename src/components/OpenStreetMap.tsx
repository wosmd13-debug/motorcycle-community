"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RidingSpot } from "@/lib/mock-data";
import { bootstrapLeafletMap } from "@/lib/leaflet-map";

type OpenStreetMapProps = {
  spots: RidingSpot[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function buildPopupContent(spot: RidingSpot) {
  return `
    <div style="font-family:sans-serif;">
      <strong style="font-size:14px;color:#1e293b;">${spot.name}</strong>
      <p style="margin:6px 0 0;font-size:12px;color:#64748b;">${spot.region}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#f97316;font-weight:600;">${spot.distance}</p>
    </div>
  `;
}

export default function OpenStreetMap({
  spots,
  selectedId,
  onSelect,
}: OpenStreetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const openPopup = useCallback((spot: RidingSpot, marker: L.Marker) => {
    marker.bindPopup(buildPopupContent(spot)).openPopup();
  }, []);

  useEffect(() => {
    if (!mapRef.current || spots.length === 0 || mapInstance.current) return;

    let cancelled = false;

    const bootstrap = async () => {
      if (!mapRef.current) return;

      const map = await bootstrapLeafletMap(L, mapRef.current, {
        center: [spots[0].lat, spots[0].lng],
        zoom: 7,
        zoomControl: true,
      });

      if (cancelled) {
        map.remove();
        return;
      }

      mapInstance.current = map;

      markersRef.current = spots.map((spot) => {
        const marker = L.marker([spot.lat, spot.lng], { icon: markerIcon }).addTo(
          map
        );

        marker.bindPopup(buildPopupContent(spot));
        marker.on("click", () => {
          onSelect(spot.id);
          map.panTo([spot.lat, spot.lng]);
          marker.openPopup();
        });

        return marker;
      });

      setMapReady(true);
    };

    void bootstrap();

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markersRef.current = [];
      setMapReady(false);
    };
  }, [spots, onSelect]);

  useEffect(() => {
    if (!mapReady || selectedId == null || !mapInstance.current) return;

    const index = spots.findIndex((s) => s.id === selectedId);
    const spot = spots[index];
    const marker = markersRef.current[index];
    if (!spot || !marker) return;

    mapInstance.current.panTo([spot.lat, spot.lng]);
    mapInstance.current.setZoom(10);
    openPopup(spot, marker);
  }, [selectedId, mapReady, spots, openPopup]);

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-orange-100 bg-slate-100 shadow-sm">
      <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
        OpenStreetMap
      </span>
      {!mapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-orange-50 text-sm text-slate-500">
          지도 불러오는 중...
        </div>
      )}
      <div ref={mapRef} className="h-[420px] w-full" />
    </div>
  );
}
