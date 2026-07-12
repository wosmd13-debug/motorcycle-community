import Link from "next/link";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import { getMemberRankingSummary } from "@/lib/ranking-server";

export default async function MemberRankSidebar() {
  const rankings = await getMemberRankingSummary(8);

  if (rankings.length === 0) {
    return (
      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">회원 랭킹</h2>
          <Link href="/ranking" className="portal-panel-more">
            더보기
          </Link>
        </div>
        <p className="p-3 text-xs text-stone-500">
          가입 후 활동하면 랭킹에 표시됩니다.
        </p>
      </section>
    );
  }

  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <h2 className="portal-panel-title">회원 랭킹</h2>
        <Link href="/ranking" className="portal-panel-more">
          더보기
        </Link>
      </div>
      <ol className="divide-y divide-[#f0ebe6]">
        {rankings.map((entry) => (
          <li key={entry.userId}>
            <Link
              href="/ranking"
              className="flex items-center gap-2 px-3 py-2 text-sm transition hover:bg-signature-light"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-bold ${
                  entry.rank <= 3
                    ? "bg-signature text-white"
                    : "bg-stone-100 text-stone-400"
                }`}
              >
                {entry.rank}
              </span>
              <AuthorWithGrade
                author={entry.nickname}
                authorGradeId={entry.grade.id}
                nicknameClassName="truncate text-stone-700"
                className="inline-flex min-w-0 flex-1 flex-wrap items-center gap-1"
              />
              <span className="shrink-0 text-xs font-semibold text-signature-dark">
                {entry.points}P
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
