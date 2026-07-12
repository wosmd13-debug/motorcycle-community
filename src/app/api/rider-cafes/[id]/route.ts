import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth-server";
import {
  canManageRiderCafe,
  parseRiderCafeBusinessFields,
  riderCafeCategories,
  type RiderCafeRegion,
} from "@/lib/rider-cafe";
import {
  deleteRiderCafe,
  getRiderCafe,
  likeRiderCafe,
  updateRiderCafe,
  viewRiderCafe,
} from "@/lib/rider-cafe-store";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  rateLimitAnonymousView,
  requireUserWithRateLimit,
} from "@/lib/request-guards";

const postRegions = riderCafeCategories.filter(
  (region): region is RiderCafeRegion => region !== "전체"
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireManageableRiderCafe(request: NextRequest, id: string) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const entry = await getRiderCafe(id);
  if (!entry) {
    return NextResponse.json(
      { error: "카페 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!canManageRiderCafe(user, entry)) {
    return NextResponse.json(
      { error: "이 카페 정보를 관리할 권한이 없습니다." },
      { status: 403 }
    );
  }

  return { user, entry };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const entry = await getRiderCafe(id);
    if (!entry) {
      return NextResponse.json(
        { error: "카페 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry: toPublicEngagementItem(entry) });
  } catch {
    return NextResponse.json(
      { error: "카페 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    if (body.action === "like") {
      const user = await requireUserWithRateLimit(request, "like");
      if (user instanceof NextResponse) return user;

      const result = await likeRiderCafe(id, user.id);
      if (!result) {
        return NextResponse.json(
          { error: "카페 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        entry: toPublicEngagementItem(result.entry),
        liked: result.liked,
      });
    }

    if (body.action === "view") {
      const limited = rateLimitAnonymousView(request);
      if (limited) return limited;

      const entry = await viewRiderCafe(id);
      if (!entry) {
        return NextResponse.json(
          { error: "카페 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ entry: toPublicEngagementItem(entry) });
    }

    if (body.action === "update") {
      const access = await requireManageableRiderCafe(request, id);
      if (access instanceof NextResponse) return access;

      const name = body.name != null ? String(body.name).trim() : undefined;
      const address = body.address != null ? String(body.address).trim() : undefined;
      const region = body.region as RiderCafeRegion | undefined;
      const description =
        body.description != null ? String(body.description).trim() : undefined;
      const amenitiesRaw =
        body.amenities != null ? String(body.amenities).trim() : undefined;

      if (name !== undefined && !name) {
        return NextResponse.json(
          { error: "카페 이름을 입력해 주세요." },
          { status: 400 }
        );
      }

      if (address !== undefined && !address) {
        return NextResponse.json(
          { error: "주소를 입력해 주세요." },
          { status: 400 }
        );
      }

      if (region && !postRegions.includes(region)) {
        return NextResponse.json(
          { error: "올바른 지역 카테고리를 선택해 주세요." },
          { status: 400 }
        );
      }

      const amenities =
        amenitiesRaw !== undefined
          ? amenitiesRaw
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined;

      const business = parseRiderCafeBusinessFields(body);

      const entry = await updateRiderCafe(id, {
        ...(name !== undefined ? { name } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(region !== undefined ? { region } : {}),
        ...(description !== undefined
          ? { description: description || undefined }
          : {}),
        ...(amenities !== undefined ? { amenities } : {}),
        ...business,
      });

      if (!entry) {
        return NextResponse.json(
          { error: "카페 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ entry: toPublicEngagementItem(entry) });
    }

    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "요청을 처리하지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const access = await requireManageableRiderCafe(request, id);
    if (access instanceof NextResponse) return access;

    const deleted = await deleteRiderCafe(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "카페 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "카페 정보를 삭제하지 못했습니다." },
      { status: 500 }
    );
  }
}
