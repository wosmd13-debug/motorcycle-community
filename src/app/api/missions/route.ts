import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserFromRequest,
  requireCurrentUserFromRequest,
} from "@/lib/auth-server";
import {
  claimMissionReward,
  getMissionDashboard,
  performMissionCheckIn,
} from "@/lib/mission-server";
import type { MissionId } from "@/lib/missions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        requiresAuth: true,
        dashboard: null,
      });
    }

    const dashboard = await getMissionDashboard({
      userId: user.id,
      nickname: user.nickname,
    });

    return NextResponse.json({ requiresAuth: false, dashboard });
  } catch {
    return NextResponse.json(
      { error: "미션 정보를 불러오지 못했습니다." },
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

    if (action === "checkin") {
      await performMissionCheckIn(user.id);
      try {
        const claimed = await claimMissionReward({
          userId: user.id,
          nickname: user.nickname,
          missionId: "daily_checkin",
        });
        return NextResponse.json({
          ok: true,
          claim: claimed.claim,
          dashboard: claimed.dashboard,
        });
      } catch {
        const dashboard = await getMissionDashboard({
          userId: user.id,
          nickname: user.nickname,
        });
        return NextResponse.json({ ok: true, dashboard });
      }
    }

    if (action === "claim") {
      const missionId = String(body.missionId ?? "") as MissionId;
      if (!missionId) {
        return NextResponse.json(
          { error: "미션 ID가 필요합니다." },
          { status: 400 }
        );
      }

      const result = await claimMissionReward({
        userId: user.id,
        nickname: user.nickname,
        missionId,
      });

      return NextResponse.json({
        ok: true,
        claim: result.claim,
        dashboard: result.dashboard,
      });
    }

    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "미션 처리에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
