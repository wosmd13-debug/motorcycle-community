import { NextResponse } from "next/server";

/**
 * 개발 전용 네이버 지도 진단. production에서는 404.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const clientId =
    process.env.NAVER_MAP_CLIENT_ID ??
    process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;
  const useNaverMap =
    Boolean(clientId) && process.env.NEXT_PUBLIC_USE_NAVER_MAP !== "false";

  const checks = {
    clientIdConfigured: Boolean(clientId),
    clientSecretConfigured: Boolean(clientSecret),
    useNaverMapEnabled: useNaverMap,
    clientIdPreview: clientId ? `${clientId.slice(0, 4)}***` : null,
    directions: "unknown" as "ok" | "failed" | "skipped" | "unknown",
    mapMode: (useNaverMap && clientId ? "naver" : "openstreetmap") as
      | "naver"
      | "openstreetmap",
    tileProvider: (useNaverMap && clientId ? "naver" : "openstreetmap") as
      | "naver"
      | "openstreetmap",
    routeProvider: "naver-directions" as const,
    hints: [] as string[],
  };

  if (!clientId) {
    checks.hints.push(
      ".env.local에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 설정하세요."
    );
  }

  if (!clientSecret) {
    checks.hints.push("NAVER_MAP_CLIENT_SECRET을 설정하세요.");
  }

  if (clientId && clientSecret) {
    try {
      const response = await fetch(
        "https://maps.apigw.ntruss.com/map-direction/v1/driving?start=127.0,37.5&goal=127.1,37.5&option=traavoidcaronly",
        {
          headers: {
            "x-ncp-apigw-api-key-id": clientId,
            "x-ncp-apigw-api-key": clientSecret,
          },
          cache: "no-store",
        }
      );

      checks.directions = response.ok ? "ok" : "failed";
      if (!response.ok) {
        checks.hints.push("경로 API 인증 실패. Client ID/Secret을 확인하세요.");
      }
    } catch {
      checks.directions = "failed";
      checks.hints.push("경로 API 요청 중 네트워크 오류가 발생했습니다.");
    }
  } else {
    checks.directions = "skipped";
  }

  return NextResponse.json(checks);
}
