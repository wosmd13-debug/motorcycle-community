import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import {
  defaultServiceIntervals,
  getMaintenanceReminders,
  serviceIntervalKeys,
  type ServiceIntervalKey,
} from "@/lib/bike-garage";
import {
  getUserBikeGarage,
  updateUserBikeProfile,
} from "@/lib/bike-garage-store";

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const garage = await getUserBikeGarage(user.id);
    const reminders = garage.bike ? getMaintenanceReminders(garage.bike) : [];

    return NextResponse.json({ garage, reminders });
  } catch {
    return NextResponse.json(
      { error: "차고 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

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
      yearRaw != null && yearRaw !== ""
        ? Number(yearRaw)
        : undefined;
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

    const lastServiceAt: Partial<Record<ServiceIntervalKey, number>> = {};
    for (const key of serviceIntervalKeys) {
      const raw = body.lastServiceAt?.[key];
      if (raw == null || raw === "") continue;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: "마지막 정비 주행거리를 올바르게 입력해 주세요." },
          { status: 400 }
        );
      }
      lastServiceAt[key] = Math.floor(parsed);
    }

    const garage = await updateUserBikeProfile(user.id, {
      model,
      year,
      displacement: String(body.displacement ?? "").trim() || undefined,
      currentMileage: Math.floor(currentMileage),
      memo: String(body.memo ?? "").trim() || undefined,
      serviceIntervals: {
        ...defaultServiceIntervals,
        ...serviceIntervals,
      },
      lastServiceAt,
    });

    const reminders = garage.bike ? getMaintenanceReminders(garage.bike) : [];

    return NextResponse.json({ garage, reminders });
  } catch {
    return NextResponse.json(
      { error: "바이크 정보 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
