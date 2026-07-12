import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import {
  canManageMemberRoute,
  validateMemberRouteInput,
} from "@/lib/member-route";
import {
  deleteMemberRoute,
  getMemberRoute,
  updateMemberRoute,
} from "@/lib/member-route-store";
import type { RouteDifficulty, RouteType, RouteWaypoint } from "@/lib/routes-data";
import { isDetailRegion } from "@/lib/regions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const route = await getMemberRoute(id);
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

  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const route = await getMemberRoute(id);
    if (!route) {
      return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
    }

    if (!canManageMemberRoute(user, route)) {
      return NextResponse.json(
        { error: "본인이 등록한 코스만 수정할 수 있습니다." },
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
    const description =
      body.description !== undefined ? String(body.description) : undefined;
    const waypoints =
      body.waypoints !== undefined
        ? ((body.waypoints ?? []) as RouteWaypoint[])
        : undefined;
    const distanceKm =
      body.distanceKm != null ? Number(body.distanceKm) : undefined;
    const durationMin =
      body.durationMin != null ? Number(body.durationMin) : undefined;

    const validationError = validateMemberRouteInput({
      name: name ?? route.name,
      region: region ?? route.region,
      type: type ?? route.type,
      difficulty: difficulty ?? route.difficulty,
      waypoints: waypoints ?? route.waypoints,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (region !== undefined && !isDetailRegion(region)) {
      return NextResponse.json({ error: "올바른 지역을 선택해 주세요." }, { status: 400 });
    }

    const updated = await updateMemberRoute(id, {
      name: name?.trim(),
      region: region as typeof route.region | undefined,
      type,
      difficulty,
      description: description?.trim(),
      waypoints,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : undefined,
      durationMin: Number.isFinite(durationMin) ? durationMin : undefined,
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

  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const route = await getMemberRoute(id);
    if (!route) {
      return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 404 });
    }

    if (!canManageMemberRoute(user, route)) {
      return NextResponse.json(
        { error: "본인이 등록한 코스만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    const result = await deleteMemberRoute(id);
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
