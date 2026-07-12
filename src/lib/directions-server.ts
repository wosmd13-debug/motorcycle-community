import {
  buildDirectionsQuery,
  type DirectionsQuery,
  type DirectionsResult,
} from "@/lib/naver-directions";

const DIRECTIONS_URLS = [
  "https://maps.apigw.ntruss.com/map-direction/v1/driving",
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving",
] as const;

const MOTORCYCLE_ROUTE_OPTION = "traavoidcaronly";

type RouteSegment = {
  summary: { distance: number; duration: number };
  path: [number, number][];
};

type NaverDirectionsResponse = {
  code?: number;
  message?: string;
  route?: Record<string, RouteSegment[]>;
  error?: {
    errorCode?: string;
    message?: string;
    details?: string;
  };
  errorMessage?: string;
};

function parseRouteData(data: NaverDirectionsResponse): RouteSegment | null {
  return data.route?.[MOTORCYCLE_ROUTE_OPTION]?.[0] ?? null;
}

export async function fetchMotorcycleDirections(
  query: DirectionsQuery
): Promise<{ ok: true; data: DirectionsResult } | { ok: false; error: string }> {
  const clientId =
    process.env.NAVER_MAP_CLIENT_ID ??
    process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      ok: false,
      error:
        "경로 API 인증 정보가 없습니다. NAVER_MAP_CLIENT_SECRET을 확인해 주세요.",
    };
  }

  const params = new URLSearchParams({
    start: query.start,
    goal: query.goal,
    option: MOTORCYCLE_ROUTE_OPTION,
  });

  if (query.waypoints) {
    params.set("waypoints", query.waypoints);
  }

  const queryString = params.toString();
  let lastError = "경로를 찾을 수 없습니다.";

  for (const baseUrl of DIRECTIONS_URLS) {
    const response = await fetch(`${baseUrl}?${queryString}`, {
      headers: {
        "x-ncp-apigw-api-key-id": clientId,
        "x-ncp-apigw-api-key": clientSecret,
      },
      cache: "no-store",
    });

    const text = await response.text();
    let data: NaverDirectionsResponse;

    try {
      data = JSON.parse(text) as NaverDirectionsResponse;
    } catch {
      lastError = "경로 API 응답 형식이 올바르지 않습니다.";
      continue;
    }

    if (response.status === 401 || data.error) {
      lastError =
        data.error?.message ??
        data.errorMessage ??
        "네이버 경로 API 인증 실패";
      continue;
    }

    if (data.code !== 0) {
      lastError = data.message ?? lastError;
      continue;
    }

    const routeData = parseRouteData(data);
    if (!routeData?.path?.length) {
      lastError = "경로 좌표를 받아오지 못했습니다.";
      continue;
    }

    return {
      ok: true,
      data: {
        path: routeData.path,
        summary: routeData.summary,
      },
    };
  }

  return { ok: false, error: lastError };
}

export { buildDirectionsQuery };
