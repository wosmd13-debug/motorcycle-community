import { NextResponse } from "next/server";
import { fetchMotorcycleDirections } from "@/lib/directions-server";
import { buildRuntimeNaverMapConfig } from "@/lib/naver-map-runtime";

export async function GET() {
  const mapConfig = buildRuntimeNaverMapConfig();
  const secretConfigured = Boolean(process.env.NAVER_MAP_CLIENT_SECRET?.trim());

  let directions: "ok" | "failed" | "skipped" = "skipped";
  let directionsError: string | null = null;

  if (mapConfig.clientId && secretConfigured) {
    const result = await fetchMotorcycleDirections({
      start: "126.978,37.5665",
      goal: "127.0276,37.4979",
    });
    directions = result.ok ? "ok" : "failed";
    if (!result.ok) directionsError = result.error;
  }

  const hints: string[] = [];

  if (!mapConfig.clientId) {
    hints.push(
      "서버에 Client ID가 없습니다. .env.production 확인 후 docker compose --env-file .env.production up -d --build 로 재빌드하세요."
    );
  }

  if (!secretConfigured) {
    hints.push("NAVER_MAP_CLIENT_SECRET이 서버에 설정되지 않았습니다.");
  }

  if (directions === "failed") {
    hints.push(
      "경로 API가 거부되었습니다. NCP 콘솔에서 Directions 15 API를 활성화했는지 확인하세요."
    );
  }

  if (mapConfig.clientId) {
    hints.push(
      "지도 타일이 안 보이면 NCP Web 서비스 URL에 https://byanra.com 과 https://www.byanra.com 을 등록하세요."
    );
  }

  return NextResponse.json({
    mapConfigured: mapConfig.configured,
    clientIdPreview: mapConfig.clientIdPreview,
    secretConfigured,
    directions,
    directionsError,
    preferredSdkParam: mapConfig.preferredSdkParam,
    sdkParams: mapConfig.sdkParams,
    hints,
  });
}
