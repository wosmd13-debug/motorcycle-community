import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-server";
import { getMissionDashboard } from "@/lib/mission-server";

export default async function HomeMissionPreview() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">라이딩 미션</h2>
          <span className="portal-badge">NEW</span>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            출석·댓글·글쓰기·인증샷 미션으로 매일 포인트를 쌓아보세요.
          </p>
          <Link
            href="/missions"
            className="inline-flex rounded-full bg-signature-dark px-4 py-2 text-xs font-bold text-white"
          >
            미션 보드 보기
          </Link>
        </div>
      </section>
    );
  }

  const dashboard = await getMissionDashboard({
    userId: user.id,
    nickname: user.nickname,
  });

  const claimable =
    dashboard.dailyClaimablePoints + dashboard.weeklyClaimablePoints;

  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <h2 className="portal-panel-title">라이딩 미션</h2>
        <Link href="/missions" className="portal-panel-more">
          전체보기
        </Link>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[var(--border-subtle)]">
        <div className="px-3 py-3 text-center">
          <p className="text-[10px] font-semibold text-[var(--text-faint)]">스트릭</p>
          <p className="mt-1 text-lg font-black text-signature-dark">
            {dashboard.streak}일
          </p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-[10px] font-semibold text-[var(--text-faint)]">오늘</p>
          <p className="mt-1 text-lg font-black text-[var(--text-primary)]">
            {dashboard.dailyCompletedCount}/{dashboard.daily.length}
          </p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-[10px] font-semibold text-[var(--text-faint)]">받을 보상</p>
          <p className="mt-1 text-lg font-black text-amber-600">{claimable}P</p>
        </div>
      </div>
      <div className="flex justify-between gap-1 border-t border-[var(--border-subtle)] px-3 py-2.5">
        {dashboard.weekDays.map((day) => (
          <div
            key={day.dateKey}
            className="flex flex-1 flex-col items-center gap-1"
            title={day.dateKey}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                day.checked
                  ? "bg-amber-500"
                  : day.isToday
                    ? "bg-signature-dark"
                    : "bg-stone-200 dark:bg-stone-700"
              }`}
            />
            <span className="text-[9px] font-semibold text-[var(--text-faint)]">
              {day.weekday}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border-subtle)] px-4 py-3">
        <Link
          href="/missions"
          className="text-xs font-bold text-signature-dark hover:underline"
        >
          {claimable > 0 ? "보상 받으러 가기 →" : "미션 진행하러 가기 →"}
        </Link>
      </div>
    </section>
  );
}
