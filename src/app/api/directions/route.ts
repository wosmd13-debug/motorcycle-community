import { NextRequest, NextResponse } from "next/server";
import {
  buildDirectionsQuery,
  fetchMotorcycleDirections,
} from "@/lib/directions-server";
import { rateLimitExternalApi } from "@/lib/request-guards";

export async function GET(request: NextRequest) {
  const limited = rateLimitExternalApi(request, "directions");
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const start = searchParams.get("start");
  const goal = searchParams.get("goal");
  const waypoints = searchParams.get("waypoints");

  if (!start || !goal) {
    return NextResponse.json(
      { error: "출발지(start)와 목적지(goal)가 필요합니다." },
      { status: 400 }
    );
  }

  const result = await fetchMotorcycleDirections({
    start,
    goal,
    waypoints: waypoints ?? undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({
    path: result.data.path,
    summary: result.data.summary,
    option: "traavoidcaronly",
  });
}
