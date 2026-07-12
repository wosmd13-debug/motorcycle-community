import { NextRequest, NextResponse } from "next/server";
import {
  fetchNearbyFuelStations,
  isOpinetConfigured,
  type FuelProductCode,
} from "@/lib/opinet-service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = searchParams.get("radius")
    ? Number(searchParams.get("radius"))
    : undefined;
  const productCode = (searchParams.get("prodcd") ?? "B027") as FuelProductCode;
  const sort = searchParams.get("sort") === "2" ? 2 : 1;
  const fresh = searchParams.get("fresh") === "1";

  const result = await fetchNearbyFuelStations({
    lat,
    lng,
    radius,
    productCode,
    sort,
    fresh,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      stations: result.stations,
      cached: result.cached,
      configured: isOpinetConfigured(),
    },
    {
      headers: {
        "Cache-Control": result.cached ? "public, max-age=300" : "no-store, max-age=0",
      },
    }
  );
}
