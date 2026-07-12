import { getCurrentUserFromRequest } from "@/lib/auth-server";
import { addMissionLikeEvent } from "@/lib/mission-store";
import type { NextRequest } from "next/server";

/** Best-effort: record like for daily mission progress when logged in */
export async function trackMissionLike(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return;
    await addMissionLikeEvent(user.id);
  } catch {
    // mission tracking must never break like action
  }
}
