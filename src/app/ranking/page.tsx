import PageHeader from "@/components/PageHeader";
import MemberRankingExplorer from "@/components/ranking/MemberRankingExplorer";
import { getCurrentUser } from "@/lib/auth-server";
import {
  getMemberRankingByUserId,
  getMemberRankings,
} from "@/lib/ranking-server";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const [rankings, user] = await Promise.all([
    getMemberRankings({ limit: 100 }),
    getCurrentUser(),
  ]);

  const myRanking = user ? await getMemberRankingByUserId(user.id) : null;

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="회원 랭킹"
          description="게시글·댓글·좋아요·조회 등 커뮤니티 활동으로 포인트가 쌓이고, 등급과 순위가 결정됩니다. 꾸준히 참여해 등급을 올려 보세요."
        />

        <MemberRankingExplorer
          initialRankings={rankings}
          myRanking={myRanking}
        />
      </div>
    </div>
  );
}
