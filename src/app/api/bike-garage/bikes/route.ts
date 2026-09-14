import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import {
  attachReminders,
  defaultServiceIntervals,
  MAX_BIKES_PER_USER,
  serviceIntervalKeys,
  type ServiceIntervalKey,
} from "@/lib/bike-garage";
import { addBikeToGarage, getUserBikeGarage } from "@/lib/bike-garage-store";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const existing = await getUserBikeGarage(user.id);
    if (existing.bikes.length >= MAX_BIKES_PER_USER) {
      return NextResponse.json(
        { error: `바이크는 최대 ${MAX_BIKES_PER_USER}대까지 등록할 수 있습니다.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const model = String(body.model ?? "").trim();

    if (!model) {
      return NextResponse.json(
        { error: "바이크 모델명은 필수입니다." },
        { status: 400 }
      );
    }

    const currentMileage = Number(body.currentMileage ?? 0);
    if (!Number.isFinite(currentMileage) || currentMileage < 0) {
      return NextResponse.json(
        { error: "주행거리를 올바르게 입력해 주세요." },
        { status: 400 }
      );
    }

    const yearRaw = body.year;
    const year =
      yearRaw != null && yearRaw !== "" ? Number(yearRaw) : undefined;
    if (year != null && (!Number.isFinite(year) || year < 1970 || year > 2100)) {
      return NextResponse.json(
        { error: "연식을 올바르게 입력해 주세요." },
        { status: 400 }
      );
    }

    const serviceIntervals: Partial<Record<ServiceIntervalKey, number>> = {};
    for (const key of serviceIntervalKeys) {
      const raw = body.serviceIntervals?.[key];
      if (raw == null || raw === "") continue;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 100 || parsed > 100_000) {
        return NextResponse.json(
          { error: `${key} 교환 주기는 100~100,000km 사이여야 합니다.` },
          { status: 400 }
        );
      }
      serviceIntervals[key] = Math.floor(parsed);
    }

    const garage = await addBikeToGarage(user.id, {
      model,
      year,
      displacement: String(body.displacement ?? "").trim() || undefined,
      currentMileage: Math.floor(currentMileage),
      memo: String(body.memo ?? "").trim() || undefined,
      serviceIntervals: { ...defaultServiceIntervals, ...serviceIntervals },
    });

    return NextResponse.json(
      { garage: attachReminders(garage) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "바이크 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
