"use client";

import { useMemo, useState } from "react";
import {
  MemberGradeLegend,
  MemberRankRow,
} from "@/components/ranking/MemberGradeBadge";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  MEMBER_GRADES,
  formatRankPoints,
  getGradeProgressMessage,
  type MemberGradeId,
  type MemberRankEntry,
} from "@/lib/ranking";

type MemberRankingExplorerProps = {
  initialRankings: MemberRankEntry[];
  myRanking: MemberRankEntry | null;
};

const gradeFilters: { id: MemberGradeId | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  ...MEMBER_GRADES.map((grade) => ({ id: grade.id, label: grade.label })),
];

export default function MemberRankingExplorer({
  initialRankings,
  myRanking,
}: MemberRankingExplorerProps) {
  const { user } = useAuth();
  const isOperator = Boolean(user?.isOperator);
  const [gradeFilter, setGradeFilter] = useState<MemberGradeId | "all">("all");

  const rankings = useMemo(() => {
    if (gradeFilter === "all") return initialRankings;
    return initialRankings
      .filter((entry) => entry.grade.id === gradeFilter)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [gradeFilter, initialRankings]);

  const gradeProgress = myRanking
    ? getGradeProgressMessage(myRanking.activity, myRanking.grade)
    : null;

  return (
    <div className="space-y-4">
      {isOperator && (
        <section className="portal-panel overflow-hidden">
          <div className="portal-panel-head">
            <h2 className="portal-panel-title">내 활동 등급</h2>
            <span className="portal-badge">운영자</span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <AuthorWithGrade
                author={user?.nickname ?? ""}
                authorGradeId="operator"
                nicknameClassName="text-lg font-bold text-stone-800"
                className="inline-flex max-w-full flex-wrap items-center gap-2"
                badgeSize="md"
              />
            </div>
            <p className="mt-1 text-sm text-stone-500">
              회원 랭킹에서 제외됩니다 · 상점 포인트 무제한
            </p>
            <p className="mt-1 text-xs text-red-600">
              사이트 운영자 전용 등급입니다
            </p>
          </div>
        </section>
      )}

      {myRanking && !isOperator && (
        <section className="portal-panel overflow-hidden">
          <div className="portal-panel-head">
            <h2 className="portal-panel-title">내 활동 등급</h2>
            <span className="portal-badge">MY</span>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <AuthorWithGrade
                  author={myRanking.nickname}
                  authorGradeId={myRanking.grade.id}
                  nicknameClassName="text-lg font-bold text-stone-800"
                  className="inline-flex max-w-full flex-wrap items-center gap-2"
                  badgeSize="md"
                />
              </div>
              <p className="mt-1 text-sm text-stone-500">
                전체 {myRanking.rank}위 · {formatRankPoints(myRanking.points)}P
              </p>
              {gradeProgress ? (
                <p className="mt-1 text-xs text-signature-dark">{gradeProgress}</p>
              ) : (
                <p className="mt-1 text-xs text-signature-dark">
                  최고 등급에 도달했습니다
                </p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-center sm:min-w-[220px]">
              <div className="rounded border border-signature/10 bg-signature-light/40 px-3 py-2">
                <dt className="text-[11px] text-stone-500">게시글</dt>
                <dd className="text-lg font-bold text-stone-800">
                  {myRanking.activity.posts}
                </dd>
              </div>
              <div className="rounded border border-signature/10 bg-signature-light/40 px-3 py-2">
                <dt className="text-[11px] text-stone-500">댓글</dt>
                <dd className="text-lg font-bold text-stone-800">
                  {myRanking.activity.comments}
                </dd>
              </div>
              <div className="rounded border border-signature/10 bg-signature-light/40 px-3 py-2">
                <dt className="text-[11px] text-stone-500">받은 좋아요</dt>
                <dd className="text-lg font-bold text-stone-800">
                  {myRanking.activity.likesReceived}
                </dd>
              </div>
              <div className="rounded border border-signature/10 bg-signature-light/40 px-3 py-2">
                <dt className="text-[11px] text-stone-500">조회수</dt>
                <dd className="text-lg font-bold text-stone-800">
                  {myRanking.activity.viewsReceived}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {!user && (
        <section className="portal-panel border-dashed p-4 text-sm text-stone-600">
          로그인하면 내 등급과 순위를 확인할 수 있습니다.
        </section>
      )}

      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">등급 안내</h2>
        </div>
        <div className="p-4">
          <MemberGradeLegend showOperatorGrade={isOperator} />
          <p className="mt-4 text-xs leading-6 text-stone-500">
            등급은 게시글·댓글·받은 좋아요·조회 수 조건을 모두 충족하면
            올라갑니다. 랭킹 순위는 활동 포인트로 정해집니다.
          </p>
        </div>
      </section>

      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">회원 랭킹</h2>
          <span className="portal-badge">TOP {rankings.length}</span>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-signature/10 px-4 py-3">
          {gradeFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setGradeFilter(filter.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                gradeFilter === filter.id
                  ? "border-signature bg-signature text-white"
                  : "border-signature/20 bg-white text-stone-600 hover:bg-signature-light"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {rankings.length === 0 ? (
          <p className="p-6 text-center text-sm text-stone-500">
            해당 등급 회원이 아직 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-signature/10 bg-signature-light/30 text-xs text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">순위</th>
                  <th className="px-4 py-3 font-semibold">회원</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">
                    글
                  </th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">
                    댓글
                  </th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">
                    좋아요
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">포인트</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebe6]">
                {rankings.map((entry) => (
                  <MemberRankRow
                    key={entry.userId}
                    entry={entry}
                    highlight={user?.id === entry.userId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
