import { NextRequest, NextResponse } from "next/server";
import {
  parseRiderCafeBusinessFields,
  riderCafeCategories,
  type RiderCafeRegion,
} from "@/lib/rider-cafe";
import {
  getRiderCafe,
  likeRiderCafe,
  updateRiderCafe,
  viewRiderCafe,
} from "@/lib/rider-cafe-store";

const postRegions = riderCafeCategories.filter(
  (region): region is RiderCafeRegion => region !== "전체"
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    return NextResponse.json({ entry });
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
      const entry = await likeRiderCafe(id);
      if (!entry) {
        return NextResponse.json(
          { error: "카페 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ entry });
    }

    if (body.action === "view") {
      const entry = await viewRiderCafe(id);
      if (!entry) {
        return NextResponse.json(
          { error: "카페 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ entry });
    }

    if (body.action === "update") {
      const name = body.name != null ? String(body.name).trim() : undefined;
      const author = body.author != null ? String(body.author).trim() : undefined;
      const address = body.address != null ? String(body.address).trim() : undefined;
      const region = body.region as RiderCafeRegion | undefined;
      const description =
        body.description != null ? String(body.description).trim() : undefined;
      const amenitiesRaw =
        body.amenities != null ? String(body.amenities).trim() : undefined;

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
        ...(author !== undefined ? { author } : {}),
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

      return NextResponse.json({ entry });
    }

    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "요청을 처리하지 못했습니다." },
      { status: 500 }
    );
  }
}
