import { NextRequest, NextResponse } from "next/server";
import { fetchWeather } from "@/lib/weather-service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const city = searchParams.get("city") ?? undefined;
  const lat = searchParams.get("lat") ?? undefined;
  const lon = searchParams.get("lon") ?? undefined;

  const result = await fetchWeather({ city, lat, lon, fresh: true });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
