import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import {
  maintenanceCategories,
  type MaintenanceCategory,
} from "@/lib/bike-garage";
import {
  deleteMaintenanceLog,
  updateMaintenanceLog,
} from "@/lib/bike-garage-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const input: {
      date?: string;
      mileage?: number;
      category?: MaintenanceCategory;
      title?: string;
      shop?: string;
      cost?: number;
      parts?: string;
      memo?: string;
    } = {};

    if (body.date != null) {
      const date = String(body.date).trim();
      if (!date || Number.isNaN(new Date(date).getTime())) {
        return NextResponse.json(
          { error: "정비 날짜를 올바르게 입력해 주세요." },
          { status: 400 }
        );
      }
      input.date = new Date(date).toISOString();
    }

    if (body.mileage != null) {
      const mileage = Number(body.mileage);
      if (!Number.isFinite(mileage) || mileage < 0) {
        return NextResponse.json(
          { error: "주행거리를 올바르게 입력해 주세요." },
          { status: 400 }
        );
      }
      input.mileage = Math.floor(mileage);
    }

    if (body.category != null) {
      const category = body.category as MaintenanceCategory;
      if (!maintenanceCategories.includes(category)) {
        return NextResponse.json(
          { error: "올바른 정비 항목을 선택해 주세요." },
          { status: 400 }
        );
      }
      input.category = category;
    }

    if (body.title != null) input.title = String(body.title).trim();
    if (body.shop != null) input.shop = String(body.shop).trim();
    if (body.parts != null) input.parts = String(body.parts).trim();
    if (body.memo != null) input.memo = String(body.memo).trim();

    if (body.cost != null && body.cost !== "") {
      const cost = Number(body.cost);
      if (!Number.isFinite(cost) || cost < 0) {
        return NextResponse.json(
          { error: "비용을 올바르게 입력해 주세요." },
          { status: 400 }
        );
      }
      input.cost = cost;
    }

    const garage = await updateMaintenanceLog(user.id, id, input);
    if (!garage) {
      return NextResponse.json(
        { error: "정비 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ garage });
  } catch {
    return NextResponse.json(
      { error: "정비 기록 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const garage = await deleteMaintenanceLog(user.id, id);
    if (!garage) {
      return NextResponse.json(
        { error: "정비 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ garage });
  } catch {
    return NextResponse.json(
      { error: "정비 기록 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
