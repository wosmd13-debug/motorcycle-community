import { NextRequest, NextResponse } from "next/server";
import { readPublicUploadFile } from "@/lib/upload-files";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

/**
 * Docker/standalone 운영 환경에서는 빌드 시점 public 목록만 정적 제공됩니다.
 * 런타임 업로드(/uploads/**)는 이 Route Handler로 디스크에서 직접 제공합니다.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { path: segments } = await context.params;
  const file = await readPublicUploadFile(segments);

  if (!file) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
