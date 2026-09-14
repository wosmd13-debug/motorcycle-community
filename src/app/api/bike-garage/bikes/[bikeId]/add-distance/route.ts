import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import { attachReminders } from "@/lib/bike-garage";
import { addRideDistanceToBike } from "@/lib/bike-garage-store";

type RouteContext = {
  params: Promise<{ bikeId: string }>;
};

/** 코스 상세에서 "이 코스 탔어요"를 누르면 그 거리를 선택한 바이크의 정비기록에 반영한다. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { bikeId } = await context.params;

  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const distanceKm = Number(body.distanceKm);

    if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
      return NextResponse.json(
        { error: "올바른 주행거리가 아닙니다." },
        { status: 400 }
      );
    }

    const garage = await addRideDistanceToBike(user.id, bikeId, distanceKm);
    if (!garage) {
      return NextResponse.json(
        { error: "바이크를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ garage: attachReminders(garage) });
  } catch {
    return NextResponse.json(
      { error: "주행거리 반영에 실패했습니다." },
      { status: 500 }
    );
  }
}
