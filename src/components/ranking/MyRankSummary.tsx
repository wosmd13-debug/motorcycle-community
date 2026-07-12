"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MemberGradeBadge from "@/components/ranking/MemberGradeBadge";
import { OPERATOR_GRADE } from "@/lib/ranking";
import { useAuth } from "@/components/auth/AuthProvider";
import type { MemberRankEntry } from "@/lib/ranking";

export default function MyRankSummary() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<MemberRankEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setRanking(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetch("/api/ranking/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return data.ranking as MemberRankEntry;
      })
      .then((data) => {
        if (!cancelled) setRanking(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  if (user.isOperator) {
    return (
      <div className="rounded border border-signature/15 bg-white px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-stone-500">내 활동 등급</p>
          <div className="flex items-center gap-2">
            <Link href="/ranking" className="text-[11px] text-signature-dark hover:underline">
              랭킹 보기
            </Link>
            <Link href="/shop" className="text-[11px] text-signature-dark hover:underline">
              상점
            </Link>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <MemberGradeBadge grade={OPERATOR_GRADE} />
          <span className="text-xs text-stone-600">랭킹 제외 · 상점 포인트 무제한</span>
        </div>
      </div>
    );
  }

  const displayGrade = ranking?.grade ?? null;

  return (
    <div className="rounded border border-signature/15 bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-stone-500">내 활동 등급</p>
        <div className="flex items-center gap-2">
          <Link href="/ranking" className="text-[11px] text-signature-dark hover:underline">
            랭킹 보기
          </Link>
          <Link href="/shop" className="text-[11px] text-signature-dark hover:underline">
            상점
          </Link>
        </div>
      </div>
      {loading ? (
        <p className="mt-1 text-xs text-stone-400">불러오는 중...</p>
      ) : displayGrade ? (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <MemberGradeBadge grade={displayGrade} />
          <span className="text-xs text-stone-600">
            {ranking ? `${ranking.rank}위 · ` : ""}
            {(ranking?.points ?? 0).toLocaleString("ko-KR")}P
          </span>
        </div>
      ) : (
        <p className="mt-1 text-xs text-stone-400">활동을 시작해 보세요.</p>
      )}
    </div>
  );
}
