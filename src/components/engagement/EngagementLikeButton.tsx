"use client";

import { useLoginRedirect } from "@/components/auth/useLoginRedirect";

type EngagementLikeButtonProps = {
  likes: number;
  liking?: boolean;
  onLike: () => void | Promise<void>;
  label?: string;
  /** 텍스트 대신(또는 함께) 보여줄 아이콘. 지정하면 "아이콘 + 숫자"로 표시됩니다. */
  icon?: React.ReactNode;
  className?: string;
};

/**
 * 추천/관심 버튼 — 비로그인이면 로그인으로 안내(모바일·데스크톱 공통).
 * 기존 onLike 로직은 로그인된 경우에만 실행됩니다.
 */
export default function EngagementLikeButton({
  likes,
  liking = false,
  onLike,
  label = "추천",
  icon,
  className = "portal-btn min-h-11 px-4 py-2.5 text-sm touch-manipulation disabled:opacity-60",
}: EngagementLikeButtonProps) {
  const ensureLoggedIn = useLoginRedirect();

  return (
    <button
      type="button"
      onClick={() => {
        if (!ensureLoggedIn()) return;
        void onLike();
      }}
      disabled={liking}
      className={className}
      aria-label={`${label} ${likes}`}
    >
      {liking ? (
        "처리 중..."
      ) : icon ? (
        <span className="inline-flex items-center gap-1">
          {icon}
          <span className="tabular-nums">{likes}</span>
        </span>
      ) : (
        `${label} ${likes}`
      )}
    </button>
  );
}
