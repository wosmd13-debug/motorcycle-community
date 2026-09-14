import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import { attachReminders } from "@/lib/bike-garage";
import { getUserBikeGarage } from "@/lib/bike-garage-store";

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const garage = await getUserBikeGarage(user.id);
    return NextResponse.json({ garage: attachReminders(garage) });
  } catch {
    return NextResponse.json(
      { error: "차고 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
