"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NAVER_MAP_CLIENT_ID } from "@/lib/map-config";
import {
  checkNaverMapsReady,
  ensureNaverMapsSdk,
  isNaverMapAuthFailed,
  resetNaverMapsSdkLoad,
  subscribeNaverMapAuthFailure,
} from "@/lib/naver-maps";

type NaverMapsContextValue = {
  ready: boolean;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const NaverMapsContext = createContext<NaverMapsContextValue>({
  ready: false,
  loading: false,
  error: null,
  reload: () => {},
});

export function useNaverMapsReady() {
  return useContext(NaverMapsContext);
}

function getErrorMessage(): string {
  return isNaverMapAuthFailed()
    ? "네이버 지도 인증 실패 — http://localhost:3000 으로 접속하고 NCP Web URL을 확인하세요."
    : "네이버 지도 SDK를 불러오지 못했습니다.";
}

export function NaverMapsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    return subscribeNaverMapAuthFailure(() => {
      setReady(false);
      setLoading(false);
      setError(getErrorMessage());
    });
  }, []);

  useEffect(() => {
    if (!NAVER_MAP_CLIENT_ID) {
      setReady(false);
      setLoading(false);
      setError("Client ID가 설정되지 않았습니다.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void ensureNaverMapsSdk(NAVER_MAP_CLIENT_ID, attempt > 0).then(async (ok) => {
      if (cancelled) return;

      if (ok && checkNaverMapsReady()) {
        setReady(true);
        setLoading(false);
        setError(null);
        return;
      }

      if (attempt === 0 && isNaverMapAuthFailed()) {
        resetNaverMapsSdkLoad();
        const retried = await ensureNaverMapsSdk(NAVER_MAP_CLIENT_ID, true);
        if (cancelled) return;
        if (retried && checkNaverMapsReady()) {
          setReady(true);
          setLoading(false);
          setError(null);
          return;
        }
      }

      setReady(false);
      setLoading(false);
      setError(getErrorMessage());
    });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const value = useMemo(
    () => ({
      ready,
      loading,
      error,
      reload: () => {
        resetNaverMapsSdkLoad();
        setReady(false);
        setLoading(true);
        setError(null);
        setAttempt((count) => count + 1);
      },
    }),
    [ready, loading, error]
  );

  return (
    <NaverMapsContext.Provider value={value}>{children}</NaverMapsContext.Provider>
  );
}
