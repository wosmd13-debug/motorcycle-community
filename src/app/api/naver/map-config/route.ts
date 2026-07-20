import { NextResponse } from "next/server";
import {
  resolveNaverMapsSdkParam,
  buildNaverMapsSdkUrl,
} from "@/lib/naver-maps";
import { NAVER_MAP_CLIENT_ID, USE_NAVER_MAP } from "@/lib/map-config";

export async function GET() {
  const clientId = NAVER_MAP_CLIENT_ID;
  const sdkParam = resolveNaverMapsSdkParam();

  return NextResponse.json({
    configured: USE_NAVER_MAP,
    clientId,
    clientIdPreview: clientId ? `${clientId.slice(0, 4)}***` : "",
    sdkParam,
    sdkUrl: clientId ? buildNaverMapsSdkUrl(clientId, sdkParam) : "",
  });
}
