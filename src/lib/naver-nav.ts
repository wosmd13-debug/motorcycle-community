import type { RouteWaypoint } from "@/lib/routes-data";

const MAX_VIA_POINTS = 5;
const MAX_ROUTE_POINTS = MAX_VIA_POINTS + 2;
const MAX_NAV_POINTS = MAX_VIA_POINTS + 1;
const KOREA_LAT = { min: 31.43, max: 44.35 };
const KOREA_LNG = { min: 122.37, max: 132.0 };
const NAVER_MAP_IOS_STORE = "https://apps.apple.com/kr/app/id311867728";
const NAVER_MAP_ANDROID_STORE =
  "https://play.google.com/store/apps/details?id=com.nhn.android.nmap";

export type NaverNavMode = "navigation" | "route";

export type NaverNavLinks = {
  primaryIosUrl: string;
  fallbackIosUrl: string;
  primaryAndroidIntentUrl: string;
  fallbackAndroidIntentUrl: string;
  webDirectionsUrl: string;
  truncated: boolean;
  usedWaypointCount: number;
  totalWaypointCount: number;
};

function formatCoord(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function encodeNavName(name: string): string {
  return encodeURIComponent(name.trim() || "목적지");
}

function resolveAppName(appName?: string): string {
  const configured = appName?.trim();
  if (configured) return configured;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return siteUrl;

  return "http://localhost:3000";
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= KOREA_LAT.min &&
    lat <= KOREA_LAT.max &&
    lng >= KOREA_LNG.min &&
    lng <= KOREA_LNG.max
  );
}

export function sanitizeWaypointsForNaverNav(
  waypoints: RouteWaypoint[]
): RouteWaypoint[] {
  const cleaned = waypoints.filter((waypoint) =>
    isValidCoord(waypoint.lat, waypoint.lng)
  );

  return cleaned.filter((waypoint, index) => {
    if (index === 0) return true;
    const previous = cleaned[index - 1];
    return !(
      Math.abs(waypoint.lat - previous.lat) < 0.00001 &&
      Math.abs(waypoint.lng - previous.lng) < 0.00001
    );
  });
}

/** 네이버 지도 앱은 경유지 최대 5곳(v1~v5)만 지원합니다. */
export function compactWaypointsForNaverNav(
  waypoints: RouteWaypoint[],
  mode: NaverNavMode = "route"
): { points: RouteWaypoint[]; truncated: boolean } {
  const maxPoints = mode === "navigation" ? MAX_NAV_POINTS : MAX_ROUTE_POINTS;

  if (waypoints.length <= maxPoints) {
    return { points: waypoints, truncated: false };
  }

  const start = waypoints[0];
  const end = waypoints[waypoints.length - 1];
  const middles = waypoints.slice(1, -1);
  const maxMiddles = maxPoints - 2;

  if (middles.length <= maxMiddles) {
    return { points: waypoints, truncated: false };
  }

  const picked: RouteWaypoint[] = [];
  for (let index = 0; index < maxMiddles; index += 1) {
    const ratio = (index + 1) / (maxMiddles + 1);
    const middleIndex = Math.min(
      middles.length - 1,
      Math.max(0, Math.round(ratio * middles.length) - 1)
    );
    const waypoint = middles[middleIndex];
    if (
      !picked.some(
        (item) => item.lat === waypoint.lat && item.lng === waypoint.lng
      )
    ) {
      picked.push(waypoint);
    }
  }

  return {
    points: [start, ...picked, end],
    truncated: true,
  };
}

function appendViaParams(parts: string[], waypoints: RouteWaypoint[]): void {
  waypoints.forEach((waypoint, index) => {
    const order = index + 1;
    parts.push(`v${order}lat=${formatCoord(waypoint.lat)}`);
    parts.push(`v${order}lng=${formatCoord(waypoint.lng)}`);
    parts.push(`v${order}name=${encodeNavName(waypoint.name)}`);
  });
}

function isSameLocation(a: RouteWaypoint, b: RouteWaypoint): boolean {
  return (
    Math.abs(a.lat - b.lat) < 0.00001 && Math.abs(a.lng - b.lng) < 0.00001
  );
}

function buildRouteQuery(waypoints: RouteWaypoint[], appName: string): string {
  const start = waypoints[0];
  const end = waypoints[waypoints.length - 1];
  const isLoop =
    waypoints.length > 2 && isSameLocation(start, end);
  const effectiveWaypoints = isLoop ? waypoints.slice(0, -1) : waypoints;

  if (effectiveWaypoints.length < 2) {
    return buildNavigationQuery(waypoints, appName);
  }

  const routeStart = effectiveWaypoints[0];
  const routeEnd = effectiveWaypoints[effectiveWaypoints.length - 1];
  const middles = effectiveWaypoints.slice(1, -1);
  const parts: string[] = [
    `slat=${formatCoord(routeStart.lat)}`,
    `slng=${formatCoord(routeStart.lng)}`,
    `sname=${encodeNavName(routeStart.name)}`,
    `dlat=${formatCoord(routeEnd.lat)}`,
    `dlng=${formatCoord(routeEnd.lng)}`,
    `dname=${encodeNavName(routeEnd.name)}`,
  ];

  appendViaParams(parts, middles);
  parts.push(`appname=${encodeURIComponent(appName)}`);
  return parts.join("&");
}

function buildNavigationQuery(
  waypoints: RouteWaypoint[],
  appName: string
): string {
  const destination = waypoints[waypoints.length - 1];
  const vias = waypoints.slice(0, -1);
  const parts: string[] = [
    `dlat=${formatCoord(destination.lat)}`,
    `dlng=${formatCoord(destination.lng)}`,
    `dname=${encodeNavName(destination.name)}`,
  ];

  appendViaParams(parts, vias.slice(0, MAX_VIA_POINTS));
  parts.push(`appname=${encodeURIComponent(appName)}`);
  return parts.join("&");
}

function formatWebPlace(waypoint: RouteWaypoint): string {
  return `${formatCoord(waypoint.lng)},${formatCoord(waypoint.lat)},${encodeNavName(waypoint.name)}`;
}

/**
 * 네이버 지도 웹 길찾기 URL
 * 경로 형식: /p/directions/{출발}/{경유}/{도착}/{이동수단}
 * 도착지만 있을 때: /p/directions/-/{도착}/-/car  (가운데가 도착지)
 * ※ /-/-/{장소} 형태는 경유지로 인식되는 경우가 있어 사용하지 않음
 */
function buildWebDirectionsUrl(waypoints: RouteWaypoint[]): string {
  if (waypoints.length === 1) {
    return `https://map.naver.com/p/directions/-/${formatWebPlace(waypoints[0])}/-/car`;
  }

  const start = waypoints[0];
  const end = waypoints[waypoints.length - 1];
  const vias = waypoints.slice(1, -1);
  const viaSegment =
    vias.length > 0 ? vias.map((waypoint) => formatWebPlace(waypoint)).join(":") : "-";

  return `https://map.naver.com/p/directions/${formatWebPlace(start)}/${viaSegment}/${formatWebPlace(end)}/car`;
}

function buildAndroidIntentUrl(actionPath: string, query: string): string {
  return `intent://${actionPath}?${query}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end`;
}

function buildUrlsForMode(
  waypoints: RouteWaypoint[],
  mode: NaverNavMode,
  appName: string
) {
  const { points, truncated } = compactWaypointsForNaverNav(waypoints, mode);
  const query =
    mode === "navigation"
      ? buildNavigationQuery(points, appName)
      : buildRouteQuery(points, appName);
  const actionPath = mode === "navigation" ? "navigation" : "route/car";

  return {
    iosUrl: `nmap://${actionPath}?${query}`,
    androidIntentUrl: buildAndroidIntentUrl(actionPath, query),
    webDirectionsUrl: buildWebDirectionsUrl(points),
    truncated,
    usedWaypointCount: points.length,
  };
}

export function buildNaverNavLinks(
  waypoints: RouteWaypoint[],
  options?: { mode?: NaverNavMode; appName?: string }
): NaverNavLinks | null {
  const sanitized = sanitizeWaypointsForNaverNav(waypoints);
  if (sanitized.length === 0) return null;

  const appName = resolveAppName(options?.appName);

  if (sanitized.length === 1) {
    const navigation = buildUrlsForMode(sanitized, "navigation", appName);
    return {
      primaryIosUrl: navigation.iosUrl,
      fallbackIosUrl: navigation.iosUrl,
      primaryAndroidIntentUrl: navigation.androidIntentUrl,
      fallbackAndroidIntentUrl: navigation.androidIntentUrl,
      webDirectionsUrl: navigation.webDirectionsUrl,
      truncated: false,
      usedWaypointCount: 1,
      totalWaypointCount: 1,
    };
  }

  if (sanitized.length < 2) return null;

  const navigation = buildUrlsForMode(sanitized, "navigation", appName);
  const route = buildUrlsForMode(sanitized, "route", appName);
  const preferred =
    options?.mode === "route"
      ? {
          iosUrl: route.iosUrl,
          androidIntentUrl: route.androidIntentUrl,
          webDirectionsUrl: route.webDirectionsUrl,
          truncated: route.truncated,
          usedWaypointCount: route.usedWaypointCount,
        }
      : {
          iosUrl: navigation.iosUrl,
          androidIntentUrl: navigation.androidIntentUrl,
          webDirectionsUrl: navigation.webDirectionsUrl,
          truncated: navigation.truncated,
          usedWaypointCount: navigation.usedWaypointCount,
        };

  return {
    primaryIosUrl: navigation.iosUrl,
    fallbackIosUrl: route.iosUrl,
    primaryAndroidIntentUrl: navigation.androidIntentUrl,
    fallbackAndroidIntentUrl: route.androidIntentUrl,
    webDirectionsUrl: preferred.webDirectionsUrl,
    truncated: preferred.truncated,
    usedWaypointCount: preferred.usedWaypointCount,
    totalWaypointCount: sanitized.length,
  };
}

export function isMobileDevice(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
}

export function isAndroidDevice(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

export function isIosDevice(userAgent: string): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

function openUrl(url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function openStoreFallback(userAgent: string): void {
  if (isIosDevice(userAgent)) {
    window.location.href = NAVER_MAP_IOS_STORE;
    return;
  }

  if (isAndroidDevice(userAgent)) {
    window.location.href = NAVER_MAP_ANDROID_STORE;
  }
}

function launchMobileApp(links: NaverNavLinks, mode: NaverNavMode): void {
  const userAgent = window.navigator.userAgent;
  const android = isAndroidDevice(userAgent);
  const primary =
    mode === "route"
      ? android
        ? links.fallbackAndroidIntentUrl
        : links.fallbackIosUrl
      : android
        ? links.primaryAndroidIntentUrl
        : links.primaryIosUrl;
  const fallback =
    mode === "route"
      ? android
        ? links.primaryAndroidIntentUrl
        : links.primaryIosUrl
      : android
        ? links.fallbackAndroidIntentUrl
        : links.fallbackIosUrl;

  let appOpened = false;
  const markOpened = () => {
    appOpened = true;
  };

  window.addEventListener("blur", markOpened, { once: true });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) markOpened();
    },
    { once: true }
  );

  if (mode === "navigation") {
    openUrl(primary);

    window.setTimeout(() => {
      if (appOpened) return;
      openUrl(fallback);
    }, 900);

    window.setTimeout(() => {
      if (appOpened) return;
      window.location.href = links.webDirectionsUrl;
    }, 2200);

    window.setTimeout(() => {
      if (appOpened) return;
      openStoreFallback(userAgent);
    }, 3600);
    return;
  }

  openUrl(primary);

  window.setTimeout(() => {
    if (appOpened) return;
    window.location.href = links.webDirectionsUrl;
  }, 1800);
}

export function openNaverNavigation(
  waypoints: RouteWaypoint[],
  mode: NaverNavMode = "navigation"
): NaverNavLinks | null {
  if (typeof window === "undefined") return null;

  const links = buildNaverNavLinks(waypoints, {
    mode,
    appName: window.location.origin || resolveAppName(),
  });

  if (!links) return null;

  const mobile = isMobileDevice(window.navigator.userAgent);

  if (mobile) {
    launchMobileApp(links, mode);
    return links;
  }

  window.open(links.webDirectionsUrl, "_blank", "noopener,noreferrer");
  return links;
}

export function buildDestinationWebDirectionsUrl(
  waypoint: RouteWaypoint
): string {
  const sanitized = sanitizeWaypointsForNaverNav([waypoint]);
  if (sanitized.length === 0) return "https://map.naver.com";
  return buildWebDirectionsUrl(sanitized);
}

export function buildDestinationNavLinkHtml(waypoint: RouteWaypoint): string {
  const url = buildDestinationWebDirectionsUrl(waypoint);
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;margin-top:10px;width:100%;padding:8px 12px;border-radius:9999px;background:#03c75a;color:#fff;font-size:12px;font-weight:700;text-decoration:none;">네이버 내비로 이동</a>`;
}
