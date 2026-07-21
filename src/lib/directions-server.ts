import { resolveRuntimeNaverMapClientId } from "@/lib/naver-map-runtime";
import type { DirectionsQuery, DirectionsResult } from "@/lib/naver-directions";
import { normalizeDirectionsError } from "@/lib/naver-directions";

const DIRECTIONS_BASE_URLS = [
  "https://maps.apigw.ntruss.com/map-direction-15/v1/driving",
  "https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving",
  "https://maps.apigw.ntruss.com/map-direction/v1/driving",
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving",
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

export type DirectionsProbeResult = {
  endpoint: string;
  option: RouteOption;
  status: number;
  ok: boolean;
  message: string;
};

function getDirectionsCredentials() {
  const clientId = resolveRuntimeNaverMapClientId();
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET?.trim() ?? "";
  return { clientId, clientSecret };
}

export function isDirectionsConfigured(): boolean {
  const { clientId, clientSecret } = getDirectionsCredentials();
  return Boolean(clientId && clientSecret);
}

function buildHeaderVariants(clientId: string, clientSecret: string) {
  return [
    {
      "x-ncp-apigw-api-key-id": clientId,
      "x-ncp-apigw-api-key": clientSecret,
    },
    {
      "X-NCP-APIGW-API-KEY-ID": clientId,
      "X-NCP-APIGW-API-KEY": clientSecret,
    },
  ] as const;
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
  clientSecret: string,
  headers: Record<string, string>
): Promise<
  | { ok: true; data: DirectionsResult; option: RouteOption; status: number }
  | { ok: false; error: string; status: number }
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
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  let data: NaverDirectionsResponse;

  try {
    data = JSON.parse(text) as NaverDirectionsResponse;
  } catch {
    return {
      ok: false,
      error: `경로 API 응답 형식 오류 (${response.status})`,
      status: response.status,
    };
  }

  if (response.status === 401 || response.status === 403 || data.error) {
    return {
      ok: false,
      error: normalizeDirectionsError(extractApiError(data)),
      status: response.status,
    };
  }

  if (data.code !== 0) {
    return {
      ok: false,
      error: normalizeDirectionsError(extractApiError(data)),
      status: response.status,
    };
  }

  const routeData = parseRouteData(data, option);
  if (!routeData?.path?.length) {
    return {
      ok: false,
      error: "경로 좌표를 받아오지 못했습니다.",
      status: response.status,
    };
  }

  return {
    ok: true,
    data: {
      path: routeData.path,
      summary: routeData.summary,
    },
    option,
    status: response.status,
  };
}

export async function probeDirectionsEndpoints(): Promise<DirectionsProbeResult[]> {
  const { clientId, clientSecret } = getDirectionsCredentials();
  if (!clientId || !clientSecret) return [];

  const query: DirectionsQuery = {
    start: "126.978,37.5665",
    goal: "127.0276,37.4979",
  };

  const results: DirectionsProbeResult[] = [];

  for (const baseUrl of DIRECTIONS_BASE_URLS) {
    for (const option of ROUTE_OPTIONS) {
      for (const headers of buildHeaderVariants(clientId, clientSecret)) {
        const result = await requestDirections(
          baseUrl,
          query,
          option,
          clientId,
          clientSecret,
          headers
        );

        results.push({
          endpoint: baseUrl,
          option,
          status: result.status,
          ok: result.ok,
          message: result.ok ? "ok" : result.error,
        });

        if (result.ok) {
          return results;
        }
      }
    }
  }

  return results;
}

export async function fetchMotorcycleDirections(
  query: DirectionsQuery
): Promise<{ ok: true; data: DirectionsResult } | { ok: false; error: string }> {
  const { clientId, clientSecret } = getDirectionsCredentials();

  if (!clientId || !clientSecret) {
    return {
      ok: false,
      error:
        "경로 API 인증 정보가 없습니다. 서버 .env.production에 NAVER_MAP_CLIENT_SECRET을 확인해 주세요.",
    };
  }

  let lastError = "경로를 찾을 수 없습니다.";

  for (const baseUrl of DIRECTIONS_BASE_URLS) {
    for (const option of ROUTE_OPTIONS) {
      for (const headers of buildHeaderVariants(clientId, clientSecret)) {
        const result = await requestDirections(
          baseUrl,
          query,
          option,
          clientId,
          clientSecret,
          headers
        );

        if (result.ok) {
          return { ok: true, data: result.data };
        }

        lastError = result.error;
      }
    }
  }

  return { ok: false, error: lastError };
}

export { buildDirectionsQuery } from "@/lib/naver-directions";
