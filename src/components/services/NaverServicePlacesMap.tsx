"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import {
  addNaverMapListener,
  buildServiceMapOptions,
  detachNaverOverlay,
  getNaverMapInitErrorMessage,
  getNaverMaps,
  prepareNaverMap,
  resetMapContainer,
  subscribeNaverMapAuthFailure,
  teardownNaverMapContainer,
  triggerNaverMapResize,
  waitForElementRef,
} from "@/lib/naver-maps";
import {
  buildLiveFuelMarkerHtml,
  type LiveFuelStation,
} from "@/lib/opinet-service";
import {
  buildLiveFuelInfoElement,
  buildServiceInfoElement,
} from "@/lib/map-info-nav";
import type { RiderPlace } from "@/lib/places-data";
import {
  buildServiceMarkerHtml,
  getServicePlaceCenter,
} from "@/lib/service-places";
import { useLatest } from "@/lib/use-latest";

export type ServiceMapViewMode = "curated" | "live";

const USER_LOCATION_MARKER_HTML =
  '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px rgba(37,99,235,0.35);"></div>';

type NaverServicePlacesMapProps = {
  places: RiderPlace[];
  liveStations?: LiveFuelStation[];
  viewMode?: ServiceMapViewMode;
  mapCenter?: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  mapFrameClassName?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  onAuthFailure?: () => void;
};

import { NAVER_MAP_CLIENT_ID } from "@/lib/map-config";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

function clearMarkers(markers: naver.maps.Marker[]) {
  markers.forEach((marker) => detachNaverOverlay(marker));
  markers.length = 0;
}

export default function NaverServicePlacesMap({
  places,
  liveStations = [],
  viewMode = "curated",
  mapCenter,
  userLocation = null,
  mapFrameClassName,
  selectedId,
  onSelect,
  onCenterChange,
  onAuthFailure,
}: NaverServicePlacesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const userLocationMarkerRef = useRef<naver.maps.Marker | null>(null);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const idleListenerRef = useRef<unknown | null>(null);
  const suppressCenterSyncRef = useRef(false);
  const userInteractedRef = useRef(false);
  const initialZoomAppliedRef = useRef(false);
  const lastFittedStationsKeyRef = useRef("");
  const [mapReady, setMapReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const onAuthFailureRef = useLatest(onAuthFailure);
  const onSelectRef = useLatest(onSelect);
  const onCenterChangeRef = useLatest(onCenterChange);
  const { ready: sdkReady, loading: sdkLoading, reload: reloadSdk } =
    useNaverMapsReady();

  const isLive = viewMode === "live";
  const hasData = isLive ? liveStations.length > 0 : places.length > 0;

  const resolveInitialCenter = useCallback(() => {
    if (mapCenter) return mapCenter;
    if (isLive && liveStations.length > 0) {
      return { lat: liveStations[0].lat, lng: liveStations[0].lng };
    }
    if (places.length > 0) return getServicePlaceCenter(places);
    return DEFAULT_CENTER;
  }, [isLive, liveStations, mapCenter, places]);

  const openCuratedInfo = useCallback(
    (place: RiderPlace, marker: naver.maps.Marker, map: naver.maps.Map) => {
      infoWindowRef.current?.setContent(buildServiceInfoElement(place));
      infoWindowRef.current?.open(map, marker);
    },
    []
  );

  const openLiveInfo = useCallback(
    (station: LiveFuelStation, marker: naver.maps.Marker, map: naver.maps.Map) => {
      infoWindowRef.current?.setContent(buildLiveFuelInfoElement(station));
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
    if (!NAVER_MAP_CLIENT_ID) {
      setInitError("API 키가 설정되지 않았습니다.");
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
      clearMarkers(markersRef.current);
      resetMapContainer(mapRef.current);
      idleListenerRef.current = null;
      lastFittedStationsKeyRef.current = "";
      initialZoomAppliedRef.current = false;
      userInteractedRef.current = false;

      const container = await waitForElementRef(() => mapRef.current, 8000);
      if (!active || !container) {
        if (active) setInitError("지도 영역을 준비하지 못했습니다.");
        return;
      }

      const center = resolveInitialCenter();

      const result = await prepareNaverMap({
        clientId: NAVER_MAP_CLIENT_ID,
        container,
        getMapOptions: () => {
          const maps = getNaverMaps();
          if (!maps) throw new Error("naver maps unavailable");
          return buildServiceMapOptions(maps, center, mapCenter ? 14 : 13);
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

        if (onCenterChangeRef.current) {
          idleListenerRef.current = addNaverMapListener(result.map, "idle", () => {
            if (suppressCenterSyncRef.current) return;
            const nextCenter = result.map.getCenter();
            onCenterChangeRef.current?.({
              lat: nextCenter.lat(),
              lng: nextCenter.lng(),
            });
          });
        }

        addNaverMapListener(result.map, "dragstart", () => {
          userInteractedRef.current = true;
        });
        addNaverMapListener(result.map, "zoom_changed", () => {
          userInteractedRef.current = true;
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
      clearMarkers(markersRef.current);
      if (userLocationMarkerRef.current) {
        detachNaverOverlay(userLocationMarkerRef.current);
        userLocationMarkerRef.current = null;
      }
      mapInstance.current = null;
      infoWindowRef.current = null;
      idleListenerRef.current = null;
      teardownNaverMapContainer(mapRef.current);
      setMapReady(false);
    };
  }, [
    onAuthFailureRef,
    onCenterChangeRef,
    resolveInitialCenter,
    sdkReady,
    bootAttempt,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !map || initialZoomAppliedRef.current) return;

    map.setZoom(isLive ? 14 : places.length === 1 ? 12 : 7);
    initialZoomAppliedRef.current = true;
  }, [isLive, mapReady, places.length]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !map) return;

    const maps = getNaverMaps();
    if (!maps) return;

    clearMarkers(markersRef.current);

    if (isLive) {
      markersRef.current = liveStations.map((station) => {
        const position = new maps.LatLng(station.lat, station.lng);
        const marker = new maps.Marker({
          map,
          position,
          title: station.name,
          icon: {
            content: buildLiveFuelMarkerHtml(
              station,
              station.id === selectedId
            ),
            anchor: new maps.Point(20, 28),
          },
        });

        addNaverMapListener(marker, "click", () => {
          onSelectRef.current(station.id);
          suppressCenterSyncRef.current = true;
          map.panTo(position);
          window.setTimeout(() => {
            suppressCenterSyncRef.current = false;
          }, 500);
          openLiveInfo(station, marker, map);
        });

        return marker;
      });

      if (liveStations.length > 0) {
        const stationsKey = liveStations.map((station) => station.id).join(",");
        if (
          stationsKey !== lastFittedStationsKeyRef.current &&
          !userInteractedRef.current
        ) {
          lastFittedStationsKeyRef.current = stationsKey;
          const bounds = new maps.LatLngBounds();
          liveStations.forEach((station) => {
            bounds.extend(new maps.LatLng(station.lat, station.lng));
          });
          if (mapCenter) {
            bounds.extend(new maps.LatLng(mapCenter.lat, mapCenter.lng));
          }
          if (userLocation) {
            bounds.extend(new maps.LatLng(userLocation.lat, userLocation.lng));
          }
          suppressCenterSyncRef.current = true;
          map.fitBounds(bounds, {
            top: 56,
            right: 40,
            bottom: 40,
            left: 40,
          });
          window.setTimeout(() => {
            suppressCenterSyncRef.current = false;
            triggerNaverMapResize(map);
          }, 300);
        }
      }
    } else {
      markersRef.current = places.map((place) => {
        const position = new maps.LatLng(place.lat, place.lng);
        const marker = new maps.Marker({
          map,
          position,
          title: place.name,
          icon: {
            content: buildServiceMarkerHtml(place, place.id === selectedId),
            anchor: new maps.Point(17, 17),
          },
        });

        addNaverMapListener(marker, "click", () => {
          onSelectRef.current(place.id);
          suppressCenterSyncRef.current = true;
          map.panTo(position);
          window.setTimeout(() => {
            suppressCenterSyncRef.current = false;
          }, 500);
          openCuratedInfo(place, marker, map);
        });

        return marker;
      });
    }

    triggerNaverMapResize(map);
  }, [
    isLive,
    liveStations,
    mapCenter,
    mapReady,
    onSelectRef,
    openCuratedInfo,
    openLiveInfo,
    places,
    selectedId,
    userLocation,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    const maps = getNaverMaps();
    if (!mapReady || !map || !maps) return;

    if (userLocationMarkerRef.current) {
      detachNaverOverlay(userLocationMarkerRef.current);
      userLocationMarkerRef.current = null;
    }

    if (!isLive || !userLocation) return;

    userLocationMarkerRef.current = new maps.Marker({
      map,
      position: new maps.LatLng(userLocation.lat, userLocation.lng),
      title: "내 위치",
      icon: {
        content: USER_LOCATION_MARKER_HTML,
        anchor: new maps.Point(8, 8),
      },
    });
  }, [isLive, mapReady, userLocation]);

  useEffect(() => {
    const map = mapInstance.current;
    const maps = getNaverMaps();
    if (!mapReady || !map || !maps || !mapCenter || !isLive) return;
    if (liveStations.length > 0) return;

    suppressCenterSyncRef.current = true;
    map.panTo(new maps.LatLng(mapCenter.lat, mapCenter.lng));
    window.setTimeout(() => {
      suppressCenterSyncRef.current = false;
      triggerNaverMapResize(map);
    }, 300);
  }, [isLive, liveStations.length, mapCenter, mapReady]);

  useEffect(() => {
    if (!mapReady || selectedId == null || !mapInstance.current) return;

    const maps = getNaverMaps();
    if (!maps) return;

    if (isLive) {
      const index = liveStations.findIndex((station) => station.id === selectedId);
      const station = liveStations[index];
      const marker = markersRef.current[index];
      if (!station || !marker) return;

      const position = new maps.LatLng(station.lat, station.lng);
      suppressCenterSyncRef.current = true;
      mapInstance.current.panTo(position);
      if (!userInteractedRef.current) {
        mapInstance.current.setZoom(15);
      }
      window.setTimeout(() => {
        suppressCenterSyncRef.current = false;
      }, 500);
      marker.setIcon({
        content: buildLiveFuelMarkerHtml(station, true),
        anchor: new maps.Point(20, 28),
      });
      openLiveInfo(station, marker, mapInstance.current);
      return;
    }

    const index = places.findIndex((place) => place.id === selectedId);
    const place = places[index];
    const marker = markersRef.current[index];
    if (!place || !marker) return;

    const position = new maps.LatLng(place.lat, place.lng);
    suppressCenterSyncRef.current = true;
    mapInstance.current.panTo(position);
    if (!userInteractedRef.current) {
      mapInstance.current.setZoom(13);
    }
    window.setTimeout(() => {
      suppressCenterSyncRef.current = false;
    }, 500);
    marker.setIcon({
      content: buildServiceMarkerHtml(place, true),
      anchor: new maps.Point(17, 17),
    });
    openCuratedInfo(place, marker, mapInstance.current);
  }, [
    selectedId,
    mapReady,
    places,
    liveStations,
    isLive,
    openCuratedInfo,
    openLiveInfo,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !map) return;

    const handleResize = () => {
      triggerNaverMapResize(map);
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, [mapReady]);

  if (!NAVER_MAP_CLIENT_ID) {
    return (
      <div className="portal-map-frame flex flex-col items-center justify-center rounded-3xl border border-dashed border-signature/30 bg-gradient-to-br from-sky-50 to-signature-light p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">
          네이버 지도 API 키가 필요합니다
        </h2>
      </div>
    );
  }

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
      <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-green-700 shadow-sm ring-1 ring-green-100">
        {isLive ? "실시간 유가 · 네이버 지도" : "네이버 지도"}
      </span>
      {!mapReady && !initError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-signature-light text-sm text-slate-500">
          {sdkLoading ? "네이버 지도 SDK 불러오는 중..." : "네이버 지도 불러오는 중..."}
        </div>
      )}
      {initError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-signature-light p-6 text-center text-sm text-slate-600">
          <p>{initError}</p>
          <button
            type="button"
            onClick={() => {
              reloadSdk();
              setBootAttempt((value) => value + 1);
            }}
            className="rounded-full bg-signature-dark px-4 py-2 text-xs font-semibold text-white hover:bg-signature-darker"
          >
            다시 불러오기
          </button>
        </div>
      )}
      {isLive && mapReady && !hasData && (
        <div className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl bg-white/95 px-4 py-3 text-center text-xs text-slate-600 shadow-sm ring-1 ring-slate-100">
          주변 주유소를 찾지 못했습니다. 지도를 이동하거나 새로고침해 보세요.
        </div>
      )}
      <div
        ref={mapRef}
        className="naver-map-root h-full min-h-[inherit] w-full"
      />
    </div>
  );
}
