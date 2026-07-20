import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 배포 반영 확인용 — 모바일 브라우저에서 /api/version 접속 */
export async function GET() {
  return NextResponse.json({
    commit: process.env.APP_COMMIT ?? "unknown",
    site: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    ok: true,
  });
}
