"use client";

import UnifiedRouteExplorer from "@/components/routes/UnifiedRouteExplorer";
import type { MemberRoute } from "@/lib/member-route";
import type { BariRoute } from "@/lib/routes-data";
import type { RiderCafeEntry } from "@/lib/rider-cafe";

type RoutesPageClientProps = {
  initialBariRoutes: BariRoute[];
  initialMemberRoutes: MemberRoute[];
  initialCommunityCafes: RiderCafeEntry[];
  initialQuery?: string;
  initialOpenId?: string;
  initialSource?: "전체" | "추천" | "회원등록";
};

export default function RoutesPageClient({
  initialBariRoutes,
  initialMemberRoutes,
  initialCommunityCafes,
  initialQuery = "",
  initialOpenId = "",
  initialSource = "전체",
}: RoutesPageClientProps) {
  return (
    <UnifiedRouteExplorer
      initialBariRoutes={initialBariRoutes}
      initialMemberRoutes={initialMemberRoutes}
      initialCommunityCafes={initialCommunityCafes}
      initialQuery={initialQuery}
      initialOpenId={initialOpenId}
      initialSource={initialSource}
    />
  );
}
