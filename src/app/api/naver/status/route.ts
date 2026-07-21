import { NextResponse } from "next/server";
import {
  fetchMotorcycleDirections,
  probeDirectionsEndpoints,
} from "@/lib/directions-server";
import { buildRuntimeNaverMapConfig } from "@/lib/naver-map-runtime";

export async function GET() {
  const mapConfig = buildRuntimeNaverMapConfig();
  const secretConfigured = Boolean(process.env.NAVER_MAP_CLIENT_SECRET?.trim());

  let directions: "ok" | "failed" | "skipped" = "skipped";
  let directionsError: string | null = null;
  let probes: Awaited<ReturnType<typeof probeDirectionsEndpoints>> = [];

  if (mapConfig.clientId && secretConfigured) {
    const result = await fetchMotorcycleDirections({
      start: "126.978,37.5665",
      goal: "127.0276,37.4979",
    });
    directions = result.ok ? "ok" : "failed";
    if (!result.ok) directionsError = result.error;

    if (!result.ok) {
      probes = await probeDirectionsEndpoints();
    }
  }

  const hints: string[] = [];

  if (!mapConfig.clientId) {
    hints.push(
      "서버 Client ID 없음 → .env.production 확인 후 docker compose --env-file .env.production up -d --build"
    );
  }

  if (!secretConfigured) {
    hints.push("NAVER_MAP_CLIENT_SECRET 없음 → NCP 인증 정보의 Client Secret을 .env.production에 입력");
  }

  if (directions === "failed") {
    hints.push(
      "NCP → byanra Application → 인증 정보 탭에서 Client ID가 rdlb*** 와 동일한지, Client Secret이 .env.production과 일치하는지 확인"
    );
    hints.push(
      "NCP → Application 수정 → Web 서비스 URL에 byanra.com 등록 (스크린샷 API 목록과 별도 메뉴)"
    );
    hints.push(
      "Directions 15 사용량이 0이면 Secret 불일치 또는 구(舊) AI·NAVER API 키를 쓰는 경우가 많습니다"
    );
  }

  if (directions === "ok") {
    hints.push("경로 API 정상. 지도만 안 보이면 Web 서비스 URL 등록을 확인하세요.");
  }

  return NextResponse.json({
    mapConfigured: mapConfig.configured,
    clientIdPreview: mapConfig.clientIdPreview,
    secretConfigured,
    directions,
    directionsError,
    preferredSdkParam: mapConfig.preferredSdkParam,
    sdkParams: mapConfig.sdkParams,
    dynamicMapUsageHint:
      "NCP Dynamic Map 사용량이 늘면 SDK는 연결됐지만 Web URL 또는 Secret 문제일 수 있습니다.",
    probes: probes.slice(0, 8),
    hints,
  });
}
