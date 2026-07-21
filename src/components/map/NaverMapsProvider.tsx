"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NAVER_MAP_CLIENT_ID } from "@/lib/map-config";
import { getNaverMapAuthErrorMessage } from "@/lib/naver-map-domains";
import {
  checkNaverMapsReady,
  ensureNaverMapsSdk,
  isNaverMapAuthFailed,
  resetNaverMapsSdkLoad,
  subscribeNaverMapAuthFailure,
} from "@/lib/naver-maps";

type RuntimeMapConfig = {
  configured: boolean;
  clientId: string;
  sdkParams?: string[];
};

type NaverMapsContextValue = {
  ready: boolean;
  loading: boolean;
  error: string | null;
  clientId: string;
  configured: boolean;
  reload: () => void;
};

const NaverMapsContext = createContext<NaverMapsContextValue>({
  ready: false,
  loading: true,
  error: null,
  clientId: "",
  configured: false,
  reload: () => {},
});

export function useNaverMapsReady() {
  return useContext(NaverMapsContext);
}

export function useNaverMapClientId() {
  const { clientId } = useNaverMapsReady();
  return clientId || NAVER_MAP_CLIENT_ID;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchRuntimeMapConfig(): Promise<RuntimeMapConfig> {
  try {
    const response = await fetch("/api/naver/map-config", { cache: "no-store" });
    if (!response.ok) {
      return { configured: Boolean(NAVER_MAP_CLIENT_ID), clientId: NAVER_MAP_CLIENT_ID };
    }
    const data = (await response.json()) as RuntimeMapConfig;
    return {
      configured: Boolean(data.configured && data.clientId),
      clientId: data.clientId || NAVER_MAP_CLIENT_ID,
      sdkParams: data.sdkParams,
    };
  } catch {
    return { configured: Boolean(NAVER_MAP_CLIENT_ID), clientId: NAVER_MAP_CLIENT_ID };
  }
}

function getErrorMessage(): string {
  return isNaverMapAuthFailed()
    ? getNaverMapAuthErrorMessage()
    : "네이버 지도 SDK를 불러오지 못했습니다.";
}

async function bootstrapNaverSdk(clientId: string): Promise<boolean> {
  resetNaverMapsSdkLoad();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      resetNaverMapsSdkLoad();
      await sleep(350);
    }

    const ok = await ensureNaverMapsSdk(clientId, true);
    if (ok && checkNaverMapsReady()) {
      return true;
    }
  }

  return false;
}

export function NaverMapsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(NAVER_MAP_CLIENT_ID);
  const [configured, setConfigured] = useState(Boolean(NAVER_MAP_CLIENT_ID));
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => {
    resetNaverMapsSdkLoad();
    setReady(false);
    setLoading(true);
    setError(null);
    setAttempt((count) => count + 1);
  }, []);

  useEffect(() => {
    return subscribeNaverMapAuthFailure(() => {
      if (checkNaverMapsReady()) return;
      setReady(false);
      setLoading(false);
      setError(getErrorMessage());
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);

      const runtime = await fetchRuntimeMapConfig();
      if (cancelled) return;

      setClientId(runtime.clientId);
      setConfigured(runtime.configured);

      if (!runtime.configured || !runtime.clientId) {
        setReady(false);
        setLoading(false);
        setError("Client ID가 설정되지 않았습니다.");
        return;
      }

      const ok = await bootstrapNaverSdk(runtime.clientId);
      if (cancelled) return;

      if (ok) {
        setReady(true);
        setLoading(false);
        setError(null);
        return;
      }

      setReady(false);
      setLoading(false);
      setError(getErrorMessage());
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const value = useMemo(
    () => ({
      ready,
      loading,
      error,
      clientId,
      configured,
      reload,
    }),
    [ready, loading, error, clientId, configured, reload]
  );

  return (
    <NaverMapsContext.Provider value={value}>{children}</NaverMapsContext.Provider>
  );
}
