import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 배포 반영 확인용 — 모바일 브라우저에서 /api/version 접속 */
export async function GET() {
  const commit = process.env.APP_COMMIT ?? "unknown";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const siteOk = site.startsWith("https://") && !site.includes("localhost");

  return NextResponse.json({
    commit,
    site,
    ok: siteOk,
    hint: siteOk
      ? "배포 설정 정상"
      : "서버 .env.production 의 NEXT_PUBLIC_SITE_URL 을 https://byanra.com 으로 고친 뒤 bash up.sh 실행",
  });
}
