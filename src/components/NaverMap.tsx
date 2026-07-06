"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RidingSpot } from "@/lib/mock-data";
import {
  addNaverMapListener,
  detachNaverOverlay,
  getDefaultZoomControlPosition,
  getNaverMapInitErrorMessage,
  getNaverMaps,
  prepareNaverMap,
  resetMapContainer,
  subscribeNaverMapAuthFailure,
  teardownNaverMapContainer,
  triggerNaverMapResize,
  waitForElementRef,
} from "@/lib/naver-maps";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import { useLatest } from "@/lib/use-latest";

type NaverMapProps = {
  spots: RidingSpot[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAuthFailure?: () => void;
};

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

function buildInfoContent(spot: RidingSpot) {
  return `
    <div style="padding:12px 14px;min-width:180px;border-radius:12px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.12);font-family:sans-serif;">
      <strong style="font-size:14px;color:#1e293b;">${spot.name}</strong>
      <p style="margin:6px 0 0;font-size:12px;color:#64748b;">${spot.region}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#f97316;font-weight:600;">${spot.distance}</p>
    </div>
  `;
}

export default function NaverMap({
  spots,
  selectedId,
  onSelect,
  onAuthFailure,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const onAuthFailureRef = useLatest(onAuthFailure);
  const onSelectRef = useLatest(onSelect);
  const { ready: sdkReady, loading: sdkLoading, reload: reloadSdk } =
    useNaverMapsReady();

  const openInfo = useCallback(
    (spot: RidingSpot, marker: naver.maps.Marker, map: naver.maps.Map) => {
      infoWindowRef.current?.setContent(buildInfoContent(spot));
      infoWindowRef.current?.open(map, marker);
    },
    []
  );

  useEffect(() => {
    const unsubscribe = subscribeNaverMapAuthFailure(() => {
      onAuthFailureRef.current?.();
    });
    return unsubscribe;
  }, [onAuthFailureRef]);

  useEffect(() => {
    if (!CLIENT_ID || spots.length === 0) {
      if (!CLIENT_ID) setInitError("API 키가 설정되지 않았습니다.");
      return;
    }

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
      markersRef.current.forEach((marker) => detachNaverOverlay(marker));
      markersRef.current = [];
      resetMapContainer(mapRef.current);

      const container = await waitForElementRef(() => mapRef.current, 8000);
      if (!active || !container) {
        if (active) setInitError("지도 영역을 준비하지 못했습니다.");
        return;
      }

      const result = await prepareNaverMap({
        clientId: CLIENT_ID,
        container,
        getMapOptions: () => {
          const maps = getNaverMaps();
          if (!maps) throw new Error("naver maps unavailable");
          return {
            center: new maps.LatLng(spots[0].lat, spots[0].lng),
            zoom: 7,
            zoomControl: true,
            zoomControlOptions: {
              position: getDefaultZoomControlPosition(),
            },
          };
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

        const map = result.map;
        markersRef.current = spots.map((spot) => {
          const position = new maps.LatLng(spot.lat, spot.lng);
          const marker = new maps.Marker({
            map,
            position,
            title: spot.name,
          });

          addNaverMapListener(marker, "click", () => {
            onSelectRef.current(spot.id);
            map.panTo(position);
            openInfo(spot, marker, map);
          });

          return marker;
        });
      } catch {
        resetMapContainer(container);
        setInitError(getNaverMapInitErrorMessage("map"));
        return;
      }

      triggerNaverMapResize(result.map);
      setMapReady(true);
    };

    void bootstrap();

    return () => {
      active = false;
      markersRef.current = [];
      mapInstance.current = null;
      infoWindowRef.current = null;
      teardownNaverMapContainer(mapRef.current);
      setMapReady(false);
    };
  }, [openInfo, onAuthFailureRef, onSelectRef, spots, sdkReady, bootAttempt]);

  useEffect(() => {
    if (!mapReady || selectedId == null || !mapInstance.current) return;

    const index = spots.findIndex((s) => s.id === selectedId);
    const spot = spots[index];
    const marker = markersRef.current[index];
    if (!spot || !marker) return;

    const maps = getNaverMaps();
    if (!maps) return;

    const position = new maps.LatLng(spot.lat, spot.lng);
    mapInstance.current.panTo(position);
    mapInstance.current.setZoom(10);
    openInfo(spot, marker, mapInstance.current);
  }, [selectedId, mapReady, spots, openInfo]);

  if (!CLIENT_ID) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-orange-200 bg-gradient-to-br from-sky-50 to-orange-50 p-8 text-center">
        <p className="text-5xl">🔑</p>
        <h2 className="mt-4 text-xl font-bold text-slate-800">
          네이버 지도 API 키가 필요합니다
        </h2>
      </div>
    );
  }

  return (
    <div className="relative h-[420px] overflow-hidden rounded-3xl border border-orange-100 bg-slate-100 shadow-sm">
      <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-green-700 shadow-sm ring-1 ring-green-100">
        네이버 지도
      </span>
      {!mapReady && !initError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-orange-50 text-sm text-slate-500">
          {sdkLoading ? "네이버 지도 SDK 불러오는 중..." : "네이버 지도 불러오는 중..."}
        </div>
      )}
      {initError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-orange-50 p-6 text-center text-sm text-slate-600">
          <p>{initError}</p>
          <button
            type="button"
            onClick={() => {
              reloadSdk();
              setBootAttempt((value) => value + 1);
            }}
            className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600"
          >
            다시 불러오기
          </button>
        </div>
      )}
      <div
        ref={mapRef}
        className="naver-map-root h-[420px] w-full"
        style={{ height: 420 }}
      />
    </div>
  );
}
