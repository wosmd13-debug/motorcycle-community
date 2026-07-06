import {
  resetMapContainer,
  waitForElementRef,
  waitForMapContainerSize,
} from "@/lib/map-container";

const SCRIPT_ID = "naver-maps-sdk";
const SDK_SRC_PREFIX = "https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=";

export type NaverMapFailReason = "script" | "sdk" | "container" | "auth" | "map";
export type NaverSdkWaitResult = "ready" | "auth" | "timeout";

declare global {
  interface Window {
    navermap_authFailure?: (() => void) & { __naverAppAuthWrap?: boolean };
    __naverMapAuthFailed?: boolean;
    __naverMapAuthEventBound?: boolean;
  }
}

function isNaverMapsReady(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      typeof window.naver !== "undefined" &&
      window.naver?.maps &&
      typeof window.naver.maps.Map === "function" &&
      typeof window.naver.maps.LatLng === "function"
  );
}

export function isNaverMapAuthFailed(): boolean {
  return Boolean(
    typeof window !== "undefined" && window.__naverMapAuthFailed === true
  );
}

export function checkNaverMapsReady(): boolean {
  if (!isNaverMapsReady()) return false;
  if (typeof window !== "undefined") {
    window.__naverMapAuthFailed = false;
  }
  return true;
}

export function getNaverMaps(): typeof naver.maps | null {
  if (!checkNaverMapsReady() || isNaverMapAuthFailed()) return null;
  return window.naver.maps;
}

const authFailureListeners = new Set<() => void>();

function notifyAuthFailure() {
  if (typeof window !== "undefined") {
    window.__naverMapAuthFailed = true;
  }
  authFailureListeners.forEach((listener) => listener());
}

/** SDK가 navermap_authFailure를 덮어써도 다시 연결합니다. */
export function ensureNaverMapAuthHandler() {
  if (typeof window === "undefined") return;

  if (window.__naverMapAuthFailed === undefined) {
    window.__naverMapAuthFailed = false;
  }

  if (window.navermap_authFailure?.__naverAppAuthWrap) {
    return;
  }

  const previous = window.navermap_authFailure;
  const wrapped = () => {
    previous?.();
    notifyAuthFailure();
  };
  wrapped.__naverAppAuthWrap = true;
  window.navermap_authFailure = wrapped;

  if (!window.__naverMapAuthEventBound) {
    window.addEventListener("navermap-auth-failure", notifyAuthFailure);
    window.__naverMapAuthEventBound = true;
  }
}

export function subscribeNaverMapAuthFailure(listener: () => void) {
  ensureNaverMapAuthHandler();
  authFailureListeners.add(listener);

  if (isNaverMapAuthFailed()) {
    listener();
  }

  return () => {
    authFailureListeners.delete(listener);
  };
}

export function waitForNaverSdk(timeoutMs = 20000): Promise<NaverSdkWaitResult> {
  return new Promise((resolve) => {
    ensureNaverMapAuthHandler();

    if (isNaverMapAuthFailed()) {
      resolve("auth");
      return;
    }
    if (checkNaverMapsReady()) {
      resolve("ready");
      return;
    }

    const started = Date.now();

    const finish = (result: NaverSdkWaitResult) => {
      window.clearInterval(timer);
      resolve(result);
    };

    const timer = window.setInterval(() => {
      ensureNaverMapAuthHandler();

      if (isNaverMapAuthFailed()) {
        finish("auth");
        return;
      }
      if (checkNaverMapsReady()) {
        finish("ready");
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        finish(isNaverMapAuthFailed() ? "auth" : "timeout");
      }
    }, 100);
  });
}

let sdkPromise: Promise<boolean> | null = null;

export function resetNaverMapsSdkLoad() {
  sdkPromise = null;

  if (typeof window === "undefined") return;

  window.__naverMapAuthFailed = false;

  const script = document.getElementById(SCRIPT_ID);
  script?.remove();

  window.naver = undefined as never;
}

function injectSdkScript(clientId: string): Promise<boolean> {
  return new Promise((resolve) => {
    ensureNaverMapAuthHandler();

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing?.src.includes("oapi.map.naver.com/openapi/v3/maps.js")) {
      void waitForNaverSdk(20000).then((result) => resolve(result === "ready"));
      return;
    }

    existing?.remove();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "text/javascript";
    script.src = `${SDK_SRC_PREFIX}${encodeURIComponent(clientId)}`;
    script.async = false;
    script.defer = false;

    script.onerror = () => resolve(false);
    script.onload = () => {
      ensureNaverMapAuthHandler();
      void waitForNaverSdk(20000).then((result) => resolve(result === "ready"));
    };

    document.head.appendChild(script);
  });
}

export async function ensureNaverMapsSdk(
  clientId: string,
  force = false
): Promise<boolean> {
  if (!clientId) return false;
  if (!force && checkNaverMapsReady()) return true;
  if (isNaverMapAuthFailed() && !force) return false;

  if (force) {
    resetNaverMapsSdkLoad();
  }

  ensureNaverMapAuthHandler();

  if (!sdkPromise || force) {
    sdkPromise = injectSdkScript(clientId);
  }

  return sdkPromise;
}

export function detachNaverOverlay(
  overlay: { setMap: (map: naver.maps.Map | null) => void } | null | undefined
) {
  if (!overlay || isNaverMapAuthFailed() || !isNaverMapsReady()) return;
  try {
    overlay.setMap(null);
  } catch {
    // ignore
  }
}

export function safeCloseInfoWindow(
  infoWindow: { close?: () => void } | null | undefined
) {
  try {
    infoWindow?.close?.();
  } catch {
    // ignore
  }
}

export function teardownNaverMapContainer(container: HTMLElement | null) {
  resetMapContainer(container);
}

export function addNaverMapListener(
  target: naver.maps.Map | naver.maps.Marker,
  eventName: string,
  listener: () => void
): unknown | null {
  const Event = window.naver?.maps?.Event;
  if (!Event) return null;
  try {
    return Event.addListener(target, eventName, listener);
  } catch {
    return null;
  }
}

export function triggerNaverMapResize(map: naver.maps.Map) {
  const fire = () => {
    try {
      window.naver?.maps?.Event?.trigger(map, "resize");
    } catch {
      // ignore
    }
  };
  requestAnimationFrame(fire);
  window.setTimeout(fire, 300);
}

export function getDefaultZoomControlPosition(): number {
  return window.naver?.maps?.Position?.TOP_RIGHT ?? 3;
}

export function getNaverMapInitErrorMessage(reason: NaverMapFailReason): string {
  switch (reason) {
    case "auth":
      return "네이버 지도 인증에 실패했습니다. http://localhost:3000 (포트 포함)으로 접속했는지, NCP 콘솔 Web URL을 확인해 주세요.";
    case "sdk":
      return "네이버 지도 SDK를 불러오지 못했습니다. 페이지를 새로고침하거나 아래 버튼으로 다시 시도해 주세요.";
    case "container":
      return "지도 영역을 준비하지 못했습니다. 페이지를 새로고침해 주세요.";
    case "map":
      return "지도 객체를 만들지 못했습니다. 아래 버튼으로 다시 시도해 주세요.";
    default:
      return "네이버 지도를 불러오지 못했습니다. 아래 버튼으로 다시 시도해 주세요.";
  }
}

export async function prepareNaverMap(options: {
  clientId: string;
  container: HTMLElement;
  getMapOptions: () => naver.maps.MapOptions;
}): Promise<
  | { ok: true; map: naver.maps.Map }
  | { ok: false; reason: NaverMapFailReason }
> {
  if (isNaverMapAuthFailed()) {
    return { ok: false, reason: "auth" };
  }

  const sdkReady = await ensureNaverMapsSdk(options.clientId);
  if (!sdkReady || !checkNaverMapsReady()) {
    return {
      ok: false,
      reason: isNaverMapAuthFailed() ? "auth" : "sdk",
    };
  }

  const sized = await waitForMapContainerSize(options.container, 10000);
  if (!sized) {
    return { ok: false, reason: "container" };
  }

  if (options.container.childElementCount > 0) {
    options.container.replaceChildren();
  }

  try {
    const maps = getNaverMaps();
    if (!maps) {
      return { ok: false, reason: isNaverMapAuthFailed() ? "auth" : "sdk" };
    }

    let mapOptions: naver.maps.MapOptions;
    try {
      mapOptions = options.getMapOptions();
    } catch {
      resetMapContainer(options.container);
      return { ok: false, reason: "map" };
    }

    const map = new maps.Map(options.container, mapOptions);
    triggerNaverMapResize(map);

    if (isNaverMapAuthFailed()) {
      resetMapContainer(options.container);
      return { ok: false, reason: "auth" };
    }

    return { ok: true, map };
  } catch {
    resetMapContainer(options.container);
    return { ok: false, reason: "map" };
  }
}

export { resetMapContainer, waitForElementRef, waitForMapContainerSize };
