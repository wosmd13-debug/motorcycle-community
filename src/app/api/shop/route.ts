import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserFromRequest,
  requireCurrentUserFromRequest,
} from "@/lib/auth-server";
import {
  equipShopItem,
  getShopDashboard,
  purchaseShopItem,
} from "@/lib/shop-server";
import type { ShopEquipped } from "@/lib/shop";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        requiresAuth: true,
        dashboard: null,
      });
    }

    const dashboard = await getShopDashboard(user.id);
    return NextResponse.json({ requiresAuth: false, dashboard });
  } catch {
    return NextResponse.json(
      { error: "상점 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "purchase") {
      const itemId = String(body.itemId ?? "");
      if (!itemId) {
        return NextResponse.json(
          { error: "상품 ID가 필요합니다." },
          { status: 400 }
        );
      }
      const dashboard = await purchaseShopItem({
        userId: user.id,
        itemId,
      });
      return NextResponse.json({ ok: true, dashboard });
    }

    if (action === "equip") {
      const slot = String(body.slot ?? "") as keyof ShopEquipped;
      const itemId =
        body.itemId === null || body.itemId === undefined
          ? null
          : String(body.itemId);
      if (!["nicknameColor", "nameFrame", "titleBadge"].includes(slot)) {
        return NextResponse.json(
          { error: "잘못된 장착 슬롯입니다." },
          { status: 400 }
        );
      }
      const dashboard = await equipShopItem({
        userId: user.id,
        itemId,
        slot,
      });
      return NextResponse.json({ ok: true, dashboard });
    }

    return NextResponse.json(
      { error: "지원하지 않는 요청입니다." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "상점 처리에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
