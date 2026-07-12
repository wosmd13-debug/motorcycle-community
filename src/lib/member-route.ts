import {
  detailRegions,
  isDetailRegion,
  matchesDetailRegion,
  type DetailRegion,
} from "@/lib/regions";
import type {
  RouteDifficulty,
  RouteType,
  RouteWaypoint,
} from "@/lib/routes-data";

export type MemberRoute = {
  id: string;
  name: string;
  region: DetailRegion;
  type: RouteType;
  difficulty: RouteDifficulty;
  description: string;
  waypoints: RouteWaypoint[];
  author: string;
  authorId: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  durationMin?: number;
  createdAt: string;
  updatedAt?: string;
};

export type CreateMemberRouteInput = {
  name: string;
  region: DetailRegion;
  type: RouteType;
  difficulty: RouteDifficulty;
  description?: string;
  waypoints: RouteWaypoint[];
  author: string;
  authorId: string;
  distanceKm?: number;
  durationMin?: number;
};

export type UpdateMemberRouteInput = {
  name?: string;
  region?: DetailRegion;
  type?: RouteType;
  difficulty?: RouteDifficulty;
  description?: string;
  waypoints?: RouteWaypoint[];
  distanceKm?: number;
  durationMin?: number;
};

export function canManageMemberRoute(
  user:
    | {
        id: string;
        isAdmin?: boolean;
        isOperator?: boolean;
      }
    | null
    | undefined,
  route: MemberRoute
): boolean {
  if (!user) return false;
  return (
    user.id === route.authorId ||
    Boolean(user.isAdmin) ||
    Boolean(user.isOperator)
  );
}

export function computeRouteAnchor(waypoints: RouteWaypoint[]) {
  if (waypoints.length === 0) {
    return { lat: 36.5, lng: 127.8 };
  }
  return { lat: waypoints[0].lat, lng: waypoints[0].lng };
}

export function normalizeMemberRoute(route: MemberRoute): MemberRoute {
  const waypoints = route.waypoints.map((waypoint, index) => ({
    name: waypoint.name?.trim() || `경유지 ${index + 1}`,
    lat: Number(waypoint.lat),
    lng: Number(waypoint.lng),
    note: waypoint.note?.trim() || undefined,
  }));
  const anchor = computeRouteAnchor(waypoints);

  return {
    ...route,
    name: route.name.trim(),
    description: route.description?.trim() ?? "",
    waypoints,
    lat: anchor.lat,
    lng: anchor.lng,
  };
}

export function validateMemberRouteInput(input: {
  name: string;
  region: string;
  type: string;
  difficulty: string;
  waypoints: RouteWaypoint[];
}): string | null {
  if (!input.name.trim()) {
    return "코스 이름을 입력해 주세요.";
  }
  if (!isDetailRegion(input.region)) {
    return "올바른 지역을 선택해 주세요.";
  }
  if (!detailRegions.includes(input.region as DetailRegion)) {
    return "올바른 지역을 선택해 주세요.";
  }
  if (!["해안", "산악", "일주", "당일치기", "투어"].includes(input.type)) {
    return "올바른 코스 유형을 선택해 주세요.";
  }
  if (!["초급", "중급", "상급"].includes(input.difficulty)) {
    return "올바른 난이도를 선택해 주세요.";
  }
  if (input.waypoints.length < 2) {
    return "출발지와 도착지를 포함해 경유지를 2곳 이상 찍어 주세요.";
  }

  for (const waypoint of input.waypoints) {
    if (!Number.isFinite(waypoint.lat) || !Number.isFinite(waypoint.lng)) {
      return "경유지 좌표가 올바르지 않습니다.";
    }
  }

  return null;
}

export function filterMemberRoutes(options: {
  routes: MemberRoute[];
  region?: string;
  difficulty?: RouteDifficulty | "전체";
  type?: RouteType | "전체";
  query?: string;
  authorId?: string;
}): MemberRoute[] {
  const query = options.query?.trim().toLowerCase() ?? "";

  return options.routes.filter((route) => {
    if (options.authorId && route.authorId !== options.authorId) return false;
    if (options.region && options.region !== "전체") {
      if (!matchesDetailRegion(route.region, options.region)) return false;
    }
    if (options.difficulty && options.difficulty !== "전체") {
      if (route.difficulty !== options.difficulty) return false;
    }
    if (options.type && options.type !== "전체") {
      if (route.type !== options.type) return false;
    }
    if (!query) return true;

    const haystack = [
      route.name,
      route.region,
      route.description,
      route.author,
      ...route.waypoints.map((waypoint) => waypoint.name),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function formatMemberRouteDistance(km?: number): string {
  if (km == null || !Number.isFinite(km)) return "거리 미정";
  if (km >= 1) return `약 ${km.toFixed(1)}km`;
  return `약 ${Math.round(km * 1000)}m`;
}

export function formatMemberRouteDuration(minutes?: number): string {
  if (minutes == null || !Number.isFinite(minutes)) return "시간 미정";
  if (minutes < 60) return `약 ${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `약 ${hours}시간 ${rest}분` : `약 ${hours}시간`;
}

export function metersToKm(meters: number): number {
  return Math.round((meters / 1000) * 10) / 10;
}

export function msToMinutes(ms: number): number {
  return Math.max(1, Math.round(ms / 60000));
}
