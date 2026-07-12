import type { BariRoute, RouteWaypoint } from "@/lib/routes-data";
import { isDetailRegion } from "@/lib/regions";

export type UpdateBariRouteInput = {
  name?: string;
  region?: BariRoute["region"];
  type?: BariRoute["type"];
  difficulty?: BariRoute["difficulty"];
  distance?: string;
  distanceKm?: number;
  duration?: string;
  bestSeason?: string[];
  description?: string;
  startPoint?: string;
  endPoint?: string;
  waypoints?: RouteWaypoint[];
  highlights?: string[];
  tips?: string[];
  cautions?: string[];
  rating?: number;
  reviewCount?: number;
};

export function canManageBariRoute(
  user:
    | {
        id: string;
        nickname: string;
        isAdmin?: boolean;
        isOperator?: boolean;
      }
    | null
    | undefined,
  route?: Pick<BariRoute, "author" | "authorId"> | null
): boolean {
  if (!user) return false;
  if (user.isAdmin || user.isOperator) return true;
  if (!route) return false;
  if (route.authorId) return route.authorId === user.id;
  if (route.author) return route.author === user.nickname;
  return false;
}

export function computeBariRouteAnchor(waypoints: RouteWaypoint[]) {
  if (waypoints.length === 0) {
    return { lat: 36.5, lng: 127.8 };
  }
  return { lat: waypoints[0].lat, lng: waypoints[0].lng };
}

export function normalizeBariRoute(route: BariRoute): BariRoute {
  const waypoints = route.waypoints.map((waypoint, index) => ({
    name: waypoint.name?.trim() || `경유지 ${index + 1}`,
    lat: Number(waypoint.lat),
    lng: Number(waypoint.lng),
    note: waypoint.note?.trim() || undefined,
  }));
  const anchor = computeBariRouteAnchor(waypoints);

  const author = route.author?.trim() || undefined;
  const authorId = route.authorId?.trim() || undefined;

  return {
    ...route,
    name: route.name.trim(),
    description: route.description.trim(),
    startPoint: route.startPoint.trim(),
    endPoint: route.endPoint.trim(),
    distance: route.distance.trim(),
    duration: route.duration.trim(),
    bestSeason: route.bestSeason.map((item) => item.trim()).filter(Boolean),
    highlights: route.highlights.map((item) => item.trim()).filter(Boolean),
    tips: route.tips.map((item) => item.trim()).filter(Boolean),
    cautions: route.cautions.map((item) => item.trim()).filter(Boolean),
    waypoints,
    lat: anchor.lat,
    lng: anchor.lng,
    ...(author ? { author } : {}),
    ...(authorId ? { authorId } : {}),
  };
}

export function parseRouteTextList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateBariRouteInput(input: {
  name: string;
  region: string;
  type: string;
  difficulty: string;
  distance: string;
  duration: string;
  startPoint: string;
  endPoint: string;
  waypoints: RouteWaypoint[];
}): string | null {
  if (!input.name.trim()) return "코스 이름을 입력해 주세요.";
  if (!isDetailRegion(input.region)) return "올바른 지역을 선택해 주세요.";
  if (!["해안", "산악", "일주", "당일치기", "투어"].includes(input.type)) {
    return "올바른 코스 유형을 선택해 주세요.";
  }
  if (!["초급", "중급", "상급"].includes(input.difficulty)) {
    return "올바른 난이도를 선택해 주세요.";
  }
  if (!input.distance.trim()) return "거리 정보를 입력해 주세요.";
  if (!input.duration.trim()) return "소요 시간을 입력해 주세요.";
  if (!input.startPoint.trim() || !input.endPoint.trim()) {
    return "출발지와 도착지를 입력해 주세요.";
  }
  if (input.waypoints.length < 2) {
    return "출발지와 도착지를 포함해 경유지를 2곳 이상 등록해 주세요.";
  }

  for (const waypoint of input.waypoints) {
    if (!Number.isFinite(waypoint.lat) || !Number.isFinite(waypoint.lng)) {
      return "경유지 좌표가 올바르지 않습니다.";
    }
  }

  return null;
}
