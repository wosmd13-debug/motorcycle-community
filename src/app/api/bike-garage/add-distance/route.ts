import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import { getMaintenanceReminders } from "@/lib/bike-garage";
import { addRideDistanceToBike } from "@/lib/bike-garage-store";

/** 코스 상세에서 "이 코스 탔어요"를 누르면 그 거리를 내 정비기록에 반영한다. */
export async function POST(request: NextRequest) {
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

    const garage = await addRideDistanceToBike(user.id, distanceKm);
    if (!garage) {
      return NextResponse.json(
        { error: "정비기록에 등록된 바이크가 없습니다. 차고를 먼저 설정해 주세요." },
        { status: 404 }
      );
    }

    const reminders = garage.bike
      ? getMaintenanceReminders(garage.bike, garage.logs)
      : [];

    return NextResponse.json({ garage, reminders });
  } catch {
    return NextResponse.json(
      { error: "주행거리 반영에 실패했습니다." },
      { status: 500 }
    );
  }
}
