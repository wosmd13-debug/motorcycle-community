import { NextResponse } from "next/server";
import { buildRuntimeNaverMapConfig } from "@/lib/naver-map-runtime";

export async function GET() {
  const config = buildRuntimeNaverMapConfig();
  return NextResponse.json(config);
}
