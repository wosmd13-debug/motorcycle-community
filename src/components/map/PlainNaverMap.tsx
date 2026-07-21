"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildServiceMapOptions,
  checkNaverMapsReady,
  getNaverMapInitErrorMessage,
  getNaverMaps,
  isNaverMapAuthFailed,
  prepareNaverMap,
  resetMapContainer,
  subscribeNaverMapAuthFailure,
  teardownNaverMapContainer,
  triggerNaverMapResize,
  waitForElementRef,
} from "@/lib/naver-maps";
import { useNaverMapClientId, useNaverMapsReady } from "@/components/map/NaverMapsProvider";
import { useLatest } from "@/lib/use-latest";

const KOREA_CENTER = { lat: 36.5, lng: 127.9 };
const DEFAULT_ZOOM = 7;

type PlainNaverMapProps = {
  onAuthFailure?: () => void;
  className?: string;
};

export default function PlainNaverMap({
  onAuthFailure,
  className = "portal-map-frame sm:min-h-[420px]",
}: PlainNaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const onAuthFailureRef = useLatest(onAuthFailure);
  const clientId = useNaverMapClientId();
  const { ready: sdkReady, loading: sdkLoading, reload: reloadSdk } =
    useNaverMapsReady();

  useEffect(() => {
    const unsubscribe = subscribeNaverMapAuthFailure(() => {
      onAuthFailureRef.current?.();
    });
    return unsubscribe;
  }, [onAuthFailureRef]);

  useEffect(() => {
    if (!clientId) {
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
      resetMapContainer(mapRef.current);

      const container = await waitForElementRef(() => mapRef.current, 8000);
      if (!active || !container) {
        if (active) setInitError("지도 영역을 준비하지 못했습니다.");
        return;
      }

      const result = await prepareNaverMap({
        clientId,
        container,
        getMapOptions: () => {
          const maps = getNaverMaps();
          if (!maps) throw new Error("naver maps unavailable");
          return buildServiceMapOptions(maps, KOREA_CENTER, DEFAULT_ZOOM);
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
      triggerNaverMapResize(result.map);
      setMapReady(true);
    };

    void bootstrap();

    return () => {
      active = false;
      mapInstance.current = null;
      teardownNaverMapContainer(mapRef.current);
      setMapReady(false);
    };
  }, [clientId, onAuthFailureRef, sdkReady, bootAttempt]);

  useEffect(() => {
    if (!mapReady) return;

    const timer = window.setTimeout(() => {
      if (isNaverMapAuthFailed() && !checkNaverMapsReady()) {
        onAuthFailureRef.current?.();
      }
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [mapReady, onAuthFailureRef]);

  if (!clientId) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-signature/30 bg-gradient-to-br from-sky-50 to-signature-light p-8 text-center ${className}`}
      >
        <h2 className="text-xl font-bold text-slate-800">
          네이버 지도 API 키가 필요합니다
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          .env.local에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-signature/20 bg-slate-100 shadow-sm ${className}`}
    >
      <span className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-green-700 shadow-sm ring-1 ring-green-100">
        네이버 지도
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
      <div ref={mapRef} className="naver-map-root h-full min-h-[inherit] w-full" />
    </div>
  );
}
