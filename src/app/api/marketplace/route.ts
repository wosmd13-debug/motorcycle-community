import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  marketplaceCategories,
  marketplaceConditions,
  marketplaceDeliveries,
  type MarketplaceCategory,
} from "@/lib/marketplace";
import { detailRegions, isDetailRegion } from "@/lib/regions";
import {
  createMarketplaceItem,
  readMarketplaceItems,
} from "@/lib/marketplace-store";

const postCategories = marketplaceCategories.filter(
  (category): category is MarketplaceCategory => category !== "전체"
);

export async function GET() {
  try {
    const items = await readMarketplaceItems();
    return NextResponse.json({
      items: items.map((item) => toPublicEngagementItem(item)),
    });
  } catch {
    return NextResponse.json(
      { error: "중고 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = body.category as MarketplaceCategory;
    const condition = body.condition as (typeof marketplaceConditions)[number];
    const delivery = body.delivery as (typeof marketplaceDeliveries)[number];
    const region = String(body.region ?? "").trim();
    const location = String(body.location ?? "").trim();
    const contactMethod = String(body.contactMethod ?? "").trim();
    const price = Number(body.price ?? 0);
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.map((url: unknown) => String(url).trim()).filter(Boolean)
      : [];

    if (!title || !description || !location) {
      return NextResponse.json(
        { error: "제목, 설명, 거래 지역은 필수입니다." },
        { status: 400 }
      );
    }

    if (!postCategories.includes(category)) {
      return NextResponse.json(
        { error: "올바른 카테고리를 선택해 주세요." },
        { status: 400 }
      );
    }

    if (!marketplaceConditions.includes(condition)) {
      return NextResponse.json(
        { error: "올바른 상품 상태를 선택해 주세요." },
        { status: 400 }
      );
    }

    if (!marketplaceDeliveries.includes(delivery)) {
      return NextResponse.json(
        { error: "올바른 거래 방식을 선택해 주세요." },
        { status: 400 }
      );
    }

    if (!isDetailRegion(region)) {
      return NextResponse.json(
        { error: "올바른 지역을 선택해 주세요." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "가격을 올바르게 입력해 주세요." },
        { status: 400 }
      );
    }

    const item = await createMarketplaceItem({
      title,
      description,
      category,
      condition,
      delivery,
      region,
      location,
      price: Math.round(price),
      imageUrls,
      seller: user.nickname,
      sellerId: user.id,
      contactMethod: contactMethod || undefined,
    });

    return NextResponse.json(
      { item: toPublicEngagementItem(item) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "매물을 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}
