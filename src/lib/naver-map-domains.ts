export const NAVER_MAP_DEFAULT_URLS = [
  "https://byanra.com",
  "https://www.byanra.com",
  "http://byanra.com",
  "http://www.byanra.com",
  "http://localhost:3000",
  "http://localhost",
  "http://127.0.0.1",
] as const;

export function buildNaverMapSuggestedUrls(origin?: string | null): string[] {
  const urls = new Set<string>(NAVER_MAP_DEFAULT_URLS);

  if (origin) {
    urls.add(origin);
    try {
      const parsed = new URL(origin);
      const { hostname, port, protocol } = parsed;

      if (hostname) {
        urls.add(`${protocol}//${hostname}`);
        if (port) {
          urls.add(`${protocol}//${hostname}:${port}`);
        }
        if (protocol === "https:") {
          urls.add(`http://${hostname}`);
          if (port) urls.add(`http://${hostname}:${port}`);
        }
      }
    } catch {
      // ignore invalid origin
    }
  }

  return [...urls];
}

export function getNaverMapAuthErrorMessage(origin?: string | null): string {
  const current =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "https://byanra.com");

  return `네이버 지도 인증에 실패했습니다. NCP 콘솔 → Maps → Application → Web 서비스 URL에 ${current} 과 https://byanra.com 을 등록한 뒤 1~2분 뒤 다시 시도해 주세요.`;
}
