import { NextResponse } from "next/server";
import { readBariRoutes } from "@/lib/bari-route-store";

export async function GET() {
  try {
    const routes = await readBariRoutes();
    return NextResponse.json({ routes });
  } catch {
    return NextResponse.json(
      { error: "추천 바리코스 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
