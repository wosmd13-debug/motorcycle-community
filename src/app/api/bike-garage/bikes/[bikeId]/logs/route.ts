import { NextRequest, NextResponse } from "next/server";
import {
  attachReminders,
  maintenanceCategories,
  maintenanceCategoryLabels,
  type MaintenanceCategory,
} from "@/lib/bike-garage";
import { addMaintenanceLog } from "@/lib/bike-garage-store";
import { requireUserWithRateLimit } from "@/lib/request-guards";

type RouteContext = {
  params: Promise<{ bikeId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { bikeId } = await context.params;

  try {
    const user = await requireUserWithRateLimit(request, "write");
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const category = body.category as MaintenanceCategory;
    const date = String(body.date ?? "").trim();
    const mileage = Number(body.mileage ?? NaN);
    const title = String(body.title ?? "").trim();
    const shop = String(body.shop ?? "").trim();
    const parts = String(body.parts ?? "").trim();
    const memo = String(body.memo ?? "").trim();
    const costRaw = body.cost;

    if (!maintenanceCategories.includes(category)) {
      return NextResponse.json(
        { error: "올바른 정비 항목을 선택해 주세요." },
        { status: 400 }
      );
    }

    const dateInput = date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput) || Number.isNaN(new Date(dateInput).getTime())) {
      return NextResponse.json(
        { error: "정비 날짜를 입력해 주세요." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(mileage) || mileage < 0) {
      return NextResponse.json(
        { error: "주행거리를 올바르게 입력해 주세요." },
        { status: 400 }
      );
    }

    const resolvedTitle =
      title || maintenanceCategoryLabels[category] || "정비 기록";

    let cost: number | undefined;
    if (costRaw != null && costRaw !== "") {
      cost = Number(costRaw);
      if (!Number.isFinite(cost) || cost < 0) {
        return NextResponse.json(
          { error: "비용을 올바르게 입력해 주세요." },
          { status: 400 }
        );
      }
    }

    const garage = await addMaintenanceLog(user.id, bikeId, {
      date: dateInput,
      mileage: Math.floor(mileage),
      category,
      title: resolvedTitle,
      shop: shop || undefined,
      cost,
      parts: parts || undefined,
      memo: memo || undefined,
    });

    if (!garage) {
      return NextResponse.json(
        { error: "바이크를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ garage: attachReminders(garage) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "정비 일지 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
