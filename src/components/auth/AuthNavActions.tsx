"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import type { MemberRankEntry } from "@/lib/ranking";

type AuthNavActionsProps = {
  layout?: "inline" | "stacked";
  /** 모바일 상단 헤더: 버튼·뱃지를 줄여 제목 영역 레이아웃 깨짐 방지 */
  compact?: boolean;
  onNavigate?: () => void;
};

export default function AuthNavActions({
  layout = "inline",
  compact = false,
  onNavigate,
}: AuthNavActionsProps) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [ranking, setRanking] = useState<MemberRankEntry | null>(null);

  const authHref = `/login?next=${encodeURIComponent(pathname || "/")}`;
  const isStacked = layout === "stacked";
  const containerClass = isStacked
    ? "flex flex-col gap-2"
    : compact
      ? "flex max-w-full min-w-0 flex-wrap items-center justify-end gap-1"
      : "flex shrink-0 items-center gap-2";
  const buttonClass = isStacked
    ? "w-full border border-signature/30 bg-[var(--surface)] px-3 py-2.5 text-sm font-semibold text-center"
    : compact
      ? "border border-signature/30 bg-[var(--surface)] px-2 py-1 text-[10px] font-semibold whitespace-nowrap"
      : "border border-signature/30 bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold";

  useEffect(() => {
    if (!user) {
      setRanking(null);
      return;
    }

    let cancelled = false;

    void fetch("/api/ranking/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return data.ranking as MemberRankEntry;
      })
      .then((data) => {
        if (!cancelled) setRanking(data);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <span className="text-xs text-[var(--text-faint)]">
        {isStacked ? "계정 정보 불러오는 중..." : "..."}
      </span>
    );
  }

  if (!user) {
    return (
      <div className={containerClass}>
        <Link
          href={authHref}
          onClick={onNavigate}
          className={`${buttonClass} text-signature-dark hover:bg-signature-light`}
        >
          로그인
        </Link>
        <Link
          href="/register"
          onClick={onNavigate}
          className={`portal-btn ${isStacked ? "w-full py-2.5 text-sm" : "px-3 py-1.5 text-xs"}`}
        >
          회원가입
        </Link>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {user.isOperator && (
        <>
          <Link
            href="/admin/reports"
            onClick={onNavigate}
            className={`${buttonClass} border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950`}
          >
            {compact ? "신고" : "신고관리"}
          </Link>
          <Link
            href="/admin/feedback"
            onClick={onNavigate}
            className={`${buttonClass} border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950`}
          >
            {compact ? "건의" : "건의·문의"}
          </Link>
        </>
      )}
      <Link
        href="/profile"
        onClick={onNavigate}
        className={
          compact
            ? "max-w-[5.5rem] truncate px-1 py-1 text-[10px] font-semibold text-signature-dark hover:underline"
            : isStacked
              ? "w-full max-w-full px-1 py-1 text-sm font-semibold text-signature-dark"
              : "max-w-full text-xs font-semibold text-signature-dark hover:underline"
        }
      >
        {compact ? (
          user.nickname
        ) : (
          <AuthorWithGrade
            author={user.nickname}
            authorGradeId={user.isOperator ? "operator" : ranking?.grade?.id}
            nicknameClassName={
              isStacked
                ? "text-sm font-semibold text-signature-dark"
                : "text-xs font-semibold text-signature-dark"
            }
            className="inline-flex max-w-full flex-wrap items-center gap-1"
            hideGrade={compact}
          />
        )}
      </Link>
      {!compact && (
        <Link
          href="/profile"
          onClick={onNavigate}
          className={`${buttonClass} font-medium text-[var(--text-secondary)] hover:bg-signature-light`}
        >
          정보수정
        </Link>
      )}
      <button
        type="button"
        onClick={() => {
          void logout();
          onNavigate?.();
        }}
        className={`${buttonClass} font-medium text-[var(--text-secondary)] hover:bg-signature-light`}
      >
        로그아웃
      </button>
    </div>
  );
}
