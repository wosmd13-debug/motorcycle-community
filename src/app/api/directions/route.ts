import { NextRequest, NextResponse } from "next/server";

const DIRECTIONS_URLS = [
  "https://maps.apigw.ntruss.com/map-direction/v1/driving",
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving",
] as const;

/** 이륜차 통행 가능 경로: 자동차전용도로 회피 우선 */
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
  errorCode?: string;
};

function parseRouteData(data: NaverDirectionsResponse): RouteSegment | null {
  return data.route?.[MOTORCYCLE_ROUTE_OPTION]?.[0] ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const start = searchParams.get("start");
  const goal = searchParams.get("goal");
  const waypoints = searchParams.get("waypoints");

  if (!start || !goal) {
    return NextResponse.json(
      { error: "출발지(start)와 목적지(goal)가 필요합니다." },
      { status: 400 }
    );
  }

  const clientId =
    process.env.NAVER_MAP_CLIENT_ID ??
    process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "경로 API 인증 정보가 없습니다. .env.local에 NAVER_MAP_CLIENT_SECRET을 추가해 주세요.",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    start,
    goal,
    option: MOTORCYCLE_ROUTE_OPTION,
  });

  if (waypoints) {
    params.set("waypoints", waypoints);
  }

  const query = params.toString();
  let lastError = "경로를 찾을 수 없습니다.";

  try {
    for (const baseUrl of DIRECTIONS_URLS) {
      const response = await fetch(`${baseUrl}?${query}`, {
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
          "네이버 경로 API 인증 실패. Directions 5 활성화와 Client Secret을 확인해 주세요.";
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

      return NextResponse.json({
        path: routeData.path,
        summary: {
          distance: routeData.summary.distance,
          duration: routeData.summary.duration,
        },
        option: MOTORCYCLE_ROUTE_OPTION,
      });
    }

    return NextResponse.json({ error: lastError }, { status: 401 });
  } catch {
    return NextResponse.json(
      { error: "경로 API 요청 중 오류가 발생했습니다." },
      { status: 502 }
    );
  }
}
