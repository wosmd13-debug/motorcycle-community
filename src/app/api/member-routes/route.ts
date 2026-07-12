import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import { validateMemberRouteInput } from "@/lib/member-route";
import type { RouteDifficulty, RouteType, RouteWaypoint } from "@/lib/routes-data";
import { isDetailRegion } from "@/lib/regions";
import {
  createMemberRoute,
  readMemberRoutes,
} from "@/lib/member-route-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const authorId = searchParams.get("authorId")?.trim();

    let routes = await readMemberRoutes();
    if (authorId) {
      routes = routes.filter((route) => route.authorId === authorId);
    }

    return NextResponse.json({ routes });
  } catch {
    return NextResponse.json(
      { error: "회원 코스 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const name = String(body.name ?? "");
    const region = String(body.region ?? "");
    const type = String(body.type ?? "") as RouteType;
    const difficulty = String(body.difficulty ?? "") as RouteDifficulty;
    const description = String(body.description ?? "");
    const waypoints = (body.waypoints ?? []) as RouteWaypoint[];
    const distanceKm =
      body.distanceKm != null ? Number(body.distanceKm) : undefined;
    const durationMin =
      body.durationMin != null ? Number(body.durationMin) : undefined;

    const validationError = validateMemberRouteInput({
      name,
      region,
      type,
      difficulty,
      waypoints,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!isDetailRegion(region)) {
      return NextResponse.json({ error: "올바른 지역을 선택해 주세요." }, { status: 400 });
    }

    const route = await createMemberRoute({
      name: name.trim(),
      region,
      type,
      difficulty,
      description: description.trim(),
      waypoints,
      author: user.nickname,
      authorId: user.id,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : undefined,
      durationMin: Number.isFinite(durationMin) ? durationMin : undefined,
    });

    return NextResponse.json({ route }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "코스를 저장하지 못했습니다." },
      { status: 500 }
    );
  }
}
