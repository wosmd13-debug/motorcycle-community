import { NextResponse } from "next/server";

export async function GET() {
  const clientId =
    process.env.NAVER_MAP_CLIENT_ID ??
    process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET;
  const useNaverMap = process.env.NEXT_PUBLIC_USE_NAVER_MAP === "true";

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
      ".env.local에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID를 rydermom 앱의 Client ID로 넣으세요."
    );
  } else {
    checks.hints.push(
      "Client ID는 콘솔 Application(rydermom) > 인증정보의 Client ID와 정확히 같아야 합니다. 다른 앱의 ID면 경로 API만 되고 지도 타일은 실패합니다."
    );
  }

  if (!clientSecret) {
    checks.hints.push("NAVER_MAP_CLIENT_SECRET도 같은 rydermom 앱에서 복사하세요.");
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
        const body = (await response.json()) as { error?: { message?: string } };
        checks.hints.push(
          body.error?.message ??
            "경로 API 인증 실패. Client ID와 Secret이 같은 Application인지 확인하세요."
        );
      }
    } catch {
      checks.directions = "failed";
      checks.hints.push("경로 API 요청 중 네트워크 오류가 발생했습니다.");
    }
  } else {
    checks.directions = "skipped";
  }

  if (!useNaverMap) {
    checks.hints.push(
      "네이버 지도를 사용하려면 .env.local에 NEXT_PUBLIC_USE_NAVER_MAP=true 를 추가하고 dev 서버를 재시작하세요."
    );
  } else {
    checks.hints.push(
      "Dynamic Map(Web)이 Application에 활성화되어 있어야 지도 타일이 표시됩니다."
    );
    checks.hints.push(
      "Web 서비스 URL에 포트 포함 등록: http://localhost:3000, http://127.0.0.1:3000"
    );
    checks.hints.push(
      "진단 페이지: http://localhost:3000/naver-map-test.html (여기서도 실패하면 콘솔 URL 문제)"
    );
    checks.hints.push("브라우저 접속: http://localhost:3000 (IP/https 사용 금지)");
  }

  checks.hints.push(
    "콘솔 → Application 등록 → Web 서비스 URL에 localhost:3000 등록 후 저장"
  );

  return NextResponse.json(checks);
}
