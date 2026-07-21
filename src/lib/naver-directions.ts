import type { RouteWaypoint } from "@/lib/routes-data";

export type DirectionsQuery = {
  start: string;
  goal: string;
  waypoints?: string;
};

export type DirectionsPathPoint = [number, number];

export type DirectionsSummary = {
  distance: number;
  duration: number;
};

export type DirectionsResult = {
  path: DirectionsPathPoint[];
  summary: DirectionsSummary;
};

/** 경유지 좌표를 네이버 Directions API 쿼리 형식으로 변환 (경도,위도) */
export function buildDirectionsQuery(
  waypoints: RouteWaypoint[]
): DirectionsQuery | null {
  if (waypoints.length < 2) return null;

  const start = `${waypoints[0].lng},${waypoints[0].lat}`;
  const goal = `${waypoints[waypoints.length - 1].lng},${waypoints[waypoints.length - 1].lat}`;
  const middle = waypoints.slice(1, -1);

  if (middle.length === 0) {
    return { start, goal };
  }

  return {
    start,
    goal,
    waypoints: middle.map((wp) => `${wp.lng},${wp.lat}`).join("|"),
  };
}

/** API path [경도, 위도] → 네이버 LatLng용 [위도, 경도] */
export function pathToLatLngs(path: DirectionsPathPoint[]): [number, number][] {
  return path.map(([lng, lat]) => [lat, lng]);
}

export function normalizeDirectionsError(message: string): string {
  if (/permission denied/i.test(message)) {
    return "네이버 경로(Directions 15) API 권한이 없습니다. NCP 콘솔 → Maps → Application에서 Directions 15 API를 선택해 주세요.";
  }
  if (/unauthorized|401|인증/i.test(message)) {
    return "네이버 경로 API 인증에 실패했습니다. Client ID·Secret과 Directions 15 API 활성화를 확인해 주세요.";
  }
  if (/quota|429/i.test(message)) {
    return "네이버 경로 API 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return message;
}

export function isDirectionsConfigError(message: string): boolean {
  return /Directions 15|인증|권한|Permission/i.test(message);
}
