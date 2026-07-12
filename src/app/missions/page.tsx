import PageHeader from "@/components/PageHeader";
import MissionExplorer from "@/components/missions/MissionExplorer";
import { getCurrentUser } from "@/lib/auth-server";
import { getMissionDashboard } from "@/lib/mission-server";

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const user = await getCurrentUser();
  const dashboard = user
    ? await getMissionDashboard({
        userId: user.id,
        nickname: user.nickname,
      })
    : null;

  return (
    <div className="portal-page">
      <div className="portal-container space-y-4">
        <PageHeader
          title="라이딩 미션"
          description="매일·매주 미션을 깨고 포인트를 쌓아보세요. 출석 스트릭과 올클리어 보너스가 랭킹에 반영됩니다."
        />
        <MissionExplorer
          initialDashboard={dashboard}
          initialRequiresAuth={!user}
        />
      </div>
    </div>
  );
}
