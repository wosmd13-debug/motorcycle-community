import { NextResponse } from "next/server";
import { checkDataStoreHealth } from "@/lib/json-store-write";

export const dynamic = "force-dynamic";

/** 배포 반영 확인용 — 모바일 브라우저에서 /api/version 접속 */
export async function GET() {
  const commit = process.env.APP_COMMIT ?? "unknown";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const siteOk = site.startsWith("https://") && !site.includes("localhost");
  const data = await checkDataStoreHealth();
  const ok = siteOk && data.writable;

  return NextResponse.json({
    commit,
    site,
    dataWritable: data.writable,
    ok,
    hint: ok
      ? "배포 설정 정상"
      : data.writable
        ? "SITE_URL 설정을 확인한 뒤 bash up.sh 실행"
        : "data 폴더 쓰기 불가 — 서버에서 bash up.sh 재실행",
    dataError: data.error,
  });
}
