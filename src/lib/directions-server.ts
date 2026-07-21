import { resolveRuntimeNaverMapClientId } from "@/lib/naver-map-runtime";
import type { DirectionsQuery, DirectionsResult } from "@/lib/naver-directions";
import { normalizeDirectionsError } from "@/lib/naver-directions";

const DIRECTIONS_BASE_URLS = [
  "https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving",
  "https://maps.apigw.ntruss.com/map-direction-15/v1/driving",
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving",
  "https://maps.apigw.ntruss.com/map-direction/v1/driving",
] as const;

const ROUTE_OPTIONS = ["traavoidcaronly", "traoptimal"] as const;

type RouteOption = (typeof ROUTE_OPTIONS)[number];

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

function getDirectionsCredentials() {
  const clientId = resolveRuntimeNaverMapClientId();
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET ?? "";
  return { clientId, clientSecret };
}

export function isDirectionsConfigured(): boolean {
  const { clientId, clientSecret } = getDirectionsCredentials();
  return Boolean(clientId && clientSecret);
}

function parseRouteData(
  data: NaverDirectionsResponse,
  option: RouteOption
): RouteSegment | null {
  return data.route?.[option]?.[0] ?? null;
}

function extractApiError(data: NaverDirectionsResponse): string {
  return (
    data.error?.message ??
    data.errorMessage ??
    data.message ??
    "경로를 찾을 수 없습니다."
  );
}

async function requestDirections(
  baseUrl: string,
  query: DirectionsQuery,
  option: RouteOption,
  clientId: string,
  clientSecret: string
): Promise<
  | { ok: true; data: DirectionsResult; option: RouteOption }
  | { ok: false; error: string; retryable: boolean }
> {
  const params = new URLSearchParams({
    start: query.start,
    goal: query.goal,
    option,
  });

  if (query.waypoints) {
    params.set("waypoints", query.waypoints);
  }

  const response = await fetch(`${baseUrl}?${params.toString()}`, {
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
    return {
      ok: false,
      error: "경로 API 응답 형식이 올바르지 않습니다.",
      retryable: true,
    };
  }

  if (response.status === 401 || response.status === 403 || data.error) {
    return {
      ok: false,
      error: normalizeDirectionsError(extractApiError(data)),
      retryable: !/permission denied/i.test(extractApiError(data)),
    };
  }

  if (data.code !== 0) {
    return {
      ok: false,
      error: normalizeDirectionsError(extractApiError(data)),
      retryable: true,
    };
  }

  const routeData = parseRouteData(data, option);
  if (!routeData?.path?.length) {
    return {
      ok: false,
      error: "경로 좌표를 받아오지 못했습니다.",
      retryable: true,
    };
  }

  return {
    ok: true,
    data: {
      path: routeData.path,
      summary: routeData.summary,
    },
    option,
  };
}

export async function fetchMotorcycleDirections(
  query: DirectionsQuery
): Promise<{ ok: true; data: DirectionsResult } | { ok: false; error: string }> {
  const { clientId, clientSecret } = getDirectionsCredentials();

  if (!clientId || !clientSecret) {
    return {
      ok: false,
      error:
        "경로 API 인증 정보가 없습니다. 서버 .env.production에 NAVER_MAP_CLIENT_SECRET을 설정해 주세요.",
    };
  }

  let lastError = "경로를 찾을 수 없습니다.";

  for (const baseUrl of DIRECTIONS_BASE_URLS) {
    for (const option of ROUTE_OPTIONS) {
      const result = await requestDirections(
        baseUrl,
        query,
        option,
        clientId,
        clientSecret
      );

      if (result.ok) {
        return { ok: true, data: result.data };
      }

      lastError = result.error;
      if (!result.retryable) {
        return { ok: false, error: lastError };
      }
    }
  }

  return { ok: false, error: lastError };
}

export { buildDirectionsQuery } from "@/lib/naver-directions";
