"use client";

import Link from "next/link";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  boardCategoryMeta,
  formatBoardListTime,
  getBoardThumbnail,
  type BoardPost,
} from "@/lib/board";
import type { MemberGradeId } from "@/lib/ranking";
import type { ShopCosmeticLook } from "@/lib/shop";

type BoardPostRowProps = {
  post: BoardPost;
  gradesByNickname?: Record<string, MemberGradeId>;
  looksByNickname?: Record<string, ShopCosmeticLook>;
};

export default function BoardPostRow({
  post,
  gradesByNickname,
  looksByNickname,
}: BoardPostRowProps) {
  const thumbnail = getBoardThumbnail(post);
  const meta = boardCategoryMeta[post.category];
  const highlight = looksByNickname?.[post.author]?.postHighlightActive;

  return (
    <Link
      href={`/board/${post.id}`}
      className={`flex w-full items-center gap-3 border-b border-[var(--dc-border-light)] px-3 py-2.5 text-left transition hover:bg-[var(--dc-hover)] sm:gap-4 sm:px-4 ${
        highlight ? "shop-post-highlight" : ""
      }`}
    >
      {thumbnail ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-[var(--surface-subtle)] sm:h-14 sm:w-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`board-category-fallback flex h-12 w-12 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold ring-1 sm:h-14 sm:w-14 sm:text-[11px] ${meta.badgeClass}`}
        >
          {post.category}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="board-post-title board-post-title-clamp text-[13px] leading-snug text-[var(--text-primary)] sm:text-sm sm:leading-5">
          {post.title}
          {post.comments.length > 0 && (
            <span className="ml-1 font-semibold text-[#e03131]">
              [{post.comments.length}]
            </span>
          )}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[var(--text-muted)]">
          <AuthorWithGrade
            author={post.author}
            authorGradeId={post.authorGradeId}
            gradesByNickname={gradesByNickname}
            looksByNickname={looksByNickname}
            nicknameClassName="font-medium text-[var(--text-secondary)]"
            className="inline-flex min-w-0 items-center gap-1"
          />
          {highlight ? (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
              HOT
            </span>
          ) : null}
          <span className="text-[var(--text-faint)]">·</span>
          <span>조회 {post.views.toLocaleString("ko-KR")}</span>
          <span className="text-[var(--text-faint)]">·</span>
          <span>추천 {post.likes.toLocaleString("ko-KR")}</span>
          <span className="text-[var(--text-faint)] sm:hidden">·</span>
          <span className="sm:hidden">{formatBoardListTime(post.createdAt)}</span>
        </div>
      </div>

      <div className="hidden shrink-0 text-right text-[11px] text-[var(--text-faint)] sm:block sm:min-w-[4.5rem]">
        <p>{formatBoardListTime(post.createdAt)}</p>
      </div>
    </Link>
  );
}
