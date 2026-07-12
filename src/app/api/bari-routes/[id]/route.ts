import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import {
  canManageBariRoute,
  validateBariRouteInput,
} from "@/lib/bari-route";
import {
  deleteBariRoute,
  getBariRoute,
  updateBariRoute,
} from "@/lib/bari-route-store";
import type { RouteDifficulty, RouteType, RouteWaypoint } from "@/lib/routes-data";
import { isDetailRegion } from "@/lib/regions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const routeId = Number(id);

  if (!Number.isFinite(routeId)) {
    return NextResponse.json({ error: "올바른 코스 ID가 아닙니다." }, { status: 400 });
  }

  try {
    const route = await getBariRoute(routeId);
    if (!route) {
      return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ route });
  } catch {
    return NextResponse.json(
      { error: "코스를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const routeId = Number(id);

  if (!Number.isFinite(routeId)) {
    return NextResponse.json({ error: "올바른 코스 ID가 아닙니다." }, { status: 400 });
  }

  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const route = await getBariRoute(routeId);
    if (!route) {
      return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
    }

    if (!canManageBariRoute(user, route)) {
      return NextResponse.json(
        { error: "추천 바리코스 관리 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = body.name !== undefined ? String(body.name) : undefined;
    const region = body.region !== undefined ? String(body.region) : undefined;
    const type =
      body.type !== undefined ? (String(body.type) as RouteType) : undefined;
    const difficulty =
      body.difficulty !== undefined
        ? (String(body.difficulty) as RouteDifficulty)
        : undefined;
    const distance =
      body.distance !== undefined ? String(body.distance) : undefined;
    const duration =
      body.duration !== undefined ? String(body.duration) : undefined;
    const startPoint =
      body.startPoint !== undefined ? String(body.startPoint) : undefined;
    const endPoint =
      body.endPoint !== undefined ? String(body.endPoint) : undefined;
    const description =
      body.description !== undefined ? String(body.description) : undefined;
    const waypoints =
      body.waypoints !== undefined
        ? ((body.waypoints ?? []) as RouteWaypoint[])
        : undefined;
    const distanceKm =
      body.distanceKm != null ? Number(body.distanceKm) : undefined;
    const rating = body.rating != null ? Number(body.rating) : undefined;
    const reviewCount =
      body.reviewCount != null ? Number(body.reviewCount) : undefined;
    const bestSeason = Array.isArray(body.bestSeason)
      ? body.bestSeason.map((item: unknown) => String(item).trim()).filter(Boolean)
      : undefined;
    const highlights = Array.isArray(body.highlights)
      ? body.highlights.map((item: unknown) => String(item).trim()).filter(Boolean)
      : undefined;
    const tips = Array.isArray(body.tips)
      ? body.tips.map((item: unknown) => String(item).trim()).filter(Boolean)
      : undefined;
    const cautions = Array.isArray(body.cautions)
      ? body.cautions.map((item: unknown) => String(item).trim()).filter(Boolean)
      : undefined;

    const validationError = validateBariRouteInput({
      name: name ?? route.name,
      region: region ?? route.region,
      type: type ?? route.type,
      difficulty: difficulty ?? route.difficulty,
      distance: distance ?? route.distance,
      duration: duration ?? route.duration,
      startPoint: startPoint ?? route.startPoint,
      endPoint: endPoint ?? route.endPoint,
      waypoints: waypoints ?? route.waypoints,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (region !== undefined && !isDetailRegion(region)) {
      return NextResponse.json({ error: "올바른 지역을 선택해 주세요." }, { status: 400 });
    }

    const updated = await updateBariRoute(routeId, {
      name: name?.trim(),
      region: region as typeof route.region | undefined,
      type,
      difficulty,
      distance: distance?.trim(),
      duration: duration?.trim(),
      startPoint: startPoint?.trim(),
      endPoint: endPoint?.trim(),
      description: description?.trim(),
      waypoints,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : undefined,
      bestSeason,
      highlights,
      tips,
      cautions,
      rating: Number.isFinite(rating) ? rating : undefined,
      reviewCount: Number.isFinite(reviewCount) ? reviewCount : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ route: updated });
  } catch {
    return NextResponse.json(
      { error: "코스를 수정하지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const routeId = Number(id);

  if (!Number.isFinite(routeId)) {
    return NextResponse.json({ error: "올바른 코스 ID가 아닙니다." }, { status: 400 });
  }

  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const route = await getBariRoute(routeId);
    if (!route) {
      return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
    }

    if (!canManageBariRoute(user, route)) {
      return NextResponse.json(
        { error: "추천 바리코스 관리 권한이 없습니다." },
        { status: 403 }
      );
    }

    const result = await deleteBariRoute(routeId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "코스를 삭제하지 못했습니다." },
      { status: 500 }
    );
  }
}
