import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  parseRiderCafeBusinessFields,
  riderCafeCategories,
  type RiderCafeRegion,
} from "@/lib/rider-cafe";
import { createRiderCafe, readRiderCafes } from "@/lib/rider-cafe-store";

const postRegions = riderCafeCategories.filter(
  (region): region is RiderCafeRegion => region !== "전체"
);

export async function GET() {
  try {
    const entries = await readRiderCafes();
    return NextResponse.json({
      entries: entries.map((entry) => toPublicEngagementItem(entry)),
    });
  } catch {
    return NextResponse.json(
      { error: "바이크 카페 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const address = String(body.address ?? "").trim();
    const region = body.region as RiderCafeRegion;
    const imageUrl = String(body.imageUrl ?? "").trim();
    const description = String(body.description ?? "").trim();
    const amenitiesRaw = String(body.amenities ?? "").trim();

    if (!name || !address || !imageUrl) {
      return NextResponse.json(
        { error: "카페 이름, 주소, 사진은 필수입니다." },
        { status: 400 }
      );
    }

    if (!postRegions.includes(region)) {
      return NextResponse.json(
        { error: "올바른 지역 카테고리를 선택해 주세요." },
        { status: 400 }
      );
    }

    const amenities = amenitiesRaw
      ? amenitiesRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined;

    const business = parseRiderCafeBusinessFields(body);

    const entry = await createRiderCafe({
      name,
      author: user.nickname,
      authorId: user.id,
      address,
      region,
      imageUrl,
      description: description || undefined,
      amenities,
      ...business,
    });

    return NextResponse.json(
      { entry: toPublicEngagementItem(entry) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "카페를 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}
