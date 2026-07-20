"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LiveFuelStationCard from "@/components/services/LiveFuelStationCard";
import SelectedServiceStationBar from "@/components/services/SelectedServiceStationBar";
import ServicePlaceCard from "@/components/services/ServicePlaceCard";
import ServicePlacesMap from "@/components/services/ServicePlacesMap";
import type { ServiceMapViewMode } from "@/components/services/NaverServicePlacesMap";
import type { RiderPlace } from "@/lib/places-data";
import {
  fuelProductLabels,
  type FuelProductCode,
  type LiveFuelStation,
} from "@/lib/opinet-service";
import {
  filterServicePlaces,
  servicePlaceRegions,
  type ServicePlaceRegion,
} from "@/lib/service-places";
import type { BariRoute } from "@/lib/routes-data";

type ServiceExplorerProps = {
  initialPlaces: RiderPlace[];
  initialBariRoutes: BariRoute[];
  initialQuery?: string;
  initialOpenId?: string;
};

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const RADIUS_OPTIONS = [
  { value: 1000, label: "1km" },
  { value: 3000, label: "3km" },
  { value: 5000, label: "5km" },
] as const;

function formatLastUpdated(date: Date | null) {
  if (!date) return null;
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function ServiceExplorer({
  initialPlaces,
  initialBariRoutes,
  initialQuery = "",
  initialOpenId = "",
}: ServiceExplorerProps) {
  const [viewMode, setViewMode] = useState<ServiceMapViewMode>("curated");
  const [opinetConfigured, setOpinetConfigured] = useState(false);
  const [region, setRegion] = useState<ServicePlaceRegion>("전체");
  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialOpenId || null
  );
  const [liveStations, setLiveStations] = useState<LiveFuelStation[]>([]);
  const [productCode, setProductCode] = useState<FuelProductCode>("B027");
  const [sortMode, setSortMode] = useState<1 | 2>(1);
  const [radius, setRadius] = useState(3000);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const centerDebounceRef = useRef<number | null>(null);
  const mapCenterRef = useRef(mapCenter);

  useEffect(() => {
    mapCenterRef.current = mapCenter;
  }, [mapCenter]);

  const filteredPlaces = useMemo(
    () =>
      filterServicePlaces({
        places: initialPlaces,
        region,
        category: "all",
        query,
      }),
    [initialPlaces, region, query]
  );

  const filteredLiveStations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return liveStations;

    return liveStations.filter((station) => {
      const haystack = [
        station.name,
        station.brandLabel,
        station.address ?? "",
        fuelProductLabels[station.productCode],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [liveStations, query]);

  const loadLiveStations = useCallback(
    async (center: { lat: number; lng: number }, fresh = false) => {
      setLoadingLive(true);
      setLiveError(null);

      try {
        const params = new URLSearchParams({
          lat: String(center.lat),
          lng: String(center.lng),
          radius: String(radius),
          prodcd: productCode,
          sort: String(sortMode),
        });
        if (fresh) params.set("fresh", "1");

        const response = await fetch(`/api/fuel/nearby?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "실시간 유가 정보를 불러오지 못했습니다.");
        }

        setLiveStations(data.stations as LiveFuelStation[]);
        setLastUpdated(
          data.fetchedAt ? new Date(data.fetchedAt as string) : new Date()
        );
      } catch (err) {
        setLiveError(
          err instanceof Error ? err.message : "실시간 유가 정보를 불러오지 못했습니다."
        );
      } finally {
        setLoadingLive(false);
      }
    },
    [productCode, radius, sortMode]
  );

  const goToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLiveError("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(center);
        setMapCenter(center);
        void loadLiveStations(center, true);
      },
      () => {
        setLiveError("위치 정보를 가져오지 못했습니다. 위치 권한을 확인해 주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [loadLiveStations]);

  useEffect(() => {
    void fetch("/api/fuel/config")
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        if (data.configured) {
          setOpinetConfigured(true);
          setViewMode("live");
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (viewMode !== "live" || !opinetConfigured) return;

    let cancelled = false;

    const start = (center: { lat: number; lng: number }, isUser = false) => {
      if (cancelled) return;
      if (isUser) setUserLocation(center);
      setMapCenter(center);
      void loadLiveStations(center);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          start(
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            true
          );
        },
        () => {
          start(DEFAULT_CENTER);
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } else {
      start(DEFAULT_CENTER);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial live load only
  }, [viewMode, opinetConfigured]);

  useEffect(() => {
    if (viewMode !== "live" || !opinetConfigured) return;
    void loadLiveStations(mapCenterRef.current, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters change
  }, [productCode, sortMode, radius]);

  useEffect(() => {
    if (viewMode !== "live" || !opinetConfigured) return;

    const intervalId = window.setInterval(() => {
      void loadLiveStations(mapCenterRef.current, true);
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [viewMode, opinetConfigured, loadLiveStations]);

  useEffect(() => {
    if (!initialOpenId) return;
    if (!initialPlaces.some((place) => place.id === initialOpenId)) return;
    setSelectedId(initialOpenId);
    setViewMode("curated");
  }, [initialOpenId, initialPlaces]);

  useEffect(() => {
    if (viewMode === "live") return;
    if (
      selectedId &&
      !filteredPlaces.some((place) => place.id === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [filteredPlaces, selectedId, viewMode]);

  useEffect(() => {
    if (viewMode !== "live") return;
    if (
      selectedId &&
      !filteredLiveStations.some((station) => station.id === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [filteredLiveStations, selectedId, viewMode]);

  const handleCenterChange = useCallback(
    (center: { lat: number; lng: number }) => {
      setMapCenter(center);
      if (viewMode !== "live" || !opinetConfigured) return;

      if (centerDebounceRef.current) {
        window.clearTimeout(centerDebounceRef.current);
      }

      centerDebounceRef.current = window.setTimeout(() => {
        void loadLiveStations(center);
      }, 700);
    },
    [viewMode, opinetConfigured, loadLiveStations]
  );

  const listCount =
    viewMode === "live" ? filteredLiveStations.length : filteredPlaces.length;

  const selectedLiveStation =
    viewMode === "live" && selectedId
      ? filteredLiveStations.find((station) => station.id === selectedId) ?? null
      : null;

  const selectedCuratedPlace =
    viewMode === "curated" && selectedId
      ? filteredPlaces.find((place) => place.id === selectedId) ?? null
      : null;

  const lastUpdatedLabel = formatLastUpdated(lastUpdated);

  return (
    <div className="space-y-4">
      <div className="portal-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-700">주유소 지도</p>
            <p className="mt-1 text-xs text-slate-500">
              {viewMode === "live" ? (
                <>
                  주변 실시간 {fuelProductLabels[productCode]} {listCount}곳 · OPINET
                  기준
                  {lastUpdatedLabel && (
                    <>
                      {" "}
                      · {lastUpdatedLabel} 갱신
                      {loadingLive ? " 중" : ""}
                    </>
                  )}
                </>
              ) : (
                <>총 {listCount}곳 · 라이더 추천 주유소</>
              )}
              {" · "}
              세차장 홍보는{" "}
              <Link
                href="/promo?category=세차장"
                className="font-semibold text-signature-dark hover:underline"
              >
                자유홍보 · 세차장
              </Link>
              에서 확인
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("live")}
              disabled={!opinetConfigured}
              className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5 ${
                viewMode === "live"
                  ? "bg-green-700 text-white"
                  : "bg-white text-slate-600 ring-1 ring-portal-border hover:bg-portal-muted disabled:opacity-50"
              }`}
            >
              실시간 유가
            </button>
            <button
              type="button"
              onClick={() => setViewMode("curated")}
              className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5 ${
                viewMode === "curated"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 ring-1 ring-portal-border hover:bg-portal-muted"
              }`}
            >
              라이더 추천
            </button>
          </div>
        </div>

        {!opinetConfigured && (
          <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
            실시간 유가 연동을 위해{" "}
            <a
              href="https://www.opinet.co.kr/user/custapi/openApiInfo.do"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              OPINET(한국석유공사)
            </a>
            에서 무료 API 키를 발급받아 서버 `.env.production`에 `OPINET_API_KEY`로
            설정해 주세요.
          </p>
        )}

        {viewMode === "live" && opinetConfigured && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(fuelProductLabels) as FuelProductCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setProductCode(code)}
                  className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5 ${
                    productCode === code
                      ? "bg-green-700 text-white"
                      : "bg-white text-slate-600 ring-1 ring-portal-border hover:bg-portal-muted"
                  }`}
                >
                  {fuelProductLabels[code]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">정렬</span>
              <button
                type="button"
                onClick={() => setSortMode(1)}
                className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5 ${
                  sortMode === 1
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-600 ring-1 ring-portal-border hover:bg-portal-muted"
                }`}
              >
                거리순
              </button>
              <button
                type="button"
                onClick={() => setSortMode(2)}
                className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5 ${
                  sortMode === 2
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-600 ring-1 ring-portal-border hover:bg-portal-muted"
                }`}
              >
                가격순
              </button>

              <span className="ml-1 text-[11px] font-semibold text-slate-500">
                반경
              </span>
              {RADIUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRadius(option.value)}
                  className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5 ${
                    radius === option.value
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-600 ring-1 ring-portal-border hover:bg-portal-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <button
                type="button"
                onClick={goToMyLocation}
                className="min-h-[44px] rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 sm:min-h-0 sm:py-1.5"
              >
                내 위치
              </button>
              <button
                type="button"
                onClick={() => void loadLiveStations(mapCenter, true)}
                disabled={loadingLive}
                className="min-h-[44px] rounded-full border border-signature/30 bg-white px-3 py-2 text-xs font-semibold text-signature-dark hover:bg-signature-light disabled:opacity-60 sm:min-h-0 sm:py-1.5"
              >
                {loadingLive ? "불러오는 중..." : "새로고침"}
              </button>
            </div>
          </div>
        )}

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            viewMode === "live"
              ? "주유소 이름, 브랜드, 주소 검색..."
              : "이름, 주소, 편의시설 검색..."
          }
          className="mt-4 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
        />

        {viewMode === "curated" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {servicePlaceRegions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRegion(item)}
                className={`min-h-[44px] rounded-full px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5 ${
                  region === item
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-portal-border hover:bg-portal-muted"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <ServicePlacesMap
        places={filteredPlaces}
        liveStations={filteredLiveStations}
        viewMode={viewMode}
        mapCenter={mapCenter}
        userLocation={userLocation}
        mapFrameClassName={viewMode === "live" ? "portal-map-frame-live" : undefined}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCenterChange={handleCenterChange}
      />

      {selectedLiveStation && (
        <SelectedServiceStationBar
          mode="live"
          station={selectedLiveStation}
          onClear={() => setSelectedId(null)}
        />
      )}

      {selectedCuratedPlace && (
        <SelectedServiceStationBar
          mode="curated"
          place={selectedCuratedPlace}
          onClear={() => setSelectedId(null)}
        />
      )}

      {liveError && viewMode === "live" && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {liveError}
        </p>
      )}

      {viewMode === "live" ? (
        loadingLive && filteredLiveStations.length === 0 ? (
          <div className="portal-panel border-dashed px-6 py-16 text-center">
            <p className="text-sm text-slate-500">실시간 유가 정보를 불러오는 중...</p>
          </div>
        ) : filteredLiveStations.length === 0 ? (
          <div className="portal-panel border-dashed px-6 py-16 text-center">
            <p className="font-semibold text-slate-700">
              주변에 표시할 주유소가 없습니다
            </p>
            <p className="mt-2 text-sm text-slate-500">
              지도를 이동하거나 반경·유종을 바꿔 보세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredLiveStations.map((station) => (
              <LiveFuelStationCard
                key={station.id}
                station={station}
                selected={selectedId === station.id}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )
      ) : filteredPlaces.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-16 text-center">
          <p className="font-semibold text-slate-700">
            조건에 맞는 주유소가 없습니다
          </p>
          <p className="mt-2 text-sm text-slate-500">
            다른 지역을 선택하거나 검색어를 바꿔 보세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPlaces.map((place) => (
            <ServicePlaceCard
              key={place.id}
              place={place}
              selected={selectedId === place.id}
              bariRoutes={initialBariRoutes}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
