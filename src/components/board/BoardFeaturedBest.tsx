"use client";

import Link from "next/link";
import {
  getBoardPopularityScore,
  getBoardThumbnail,
  type BoardPost,
} from "@/lib/board";
import type { ShopCosmeticLook } from "@/lib/shop";

type BoardFeaturedBestProps = {
  posts: BoardPost[];
  looksByNickname?: Record<string, ShopCosmeticLook>;
};

export default function BoardFeaturedBest({
  posts,
  looksByNickname,
}: BoardFeaturedBestProps) {
  if (posts.length === 0) return null;

  return (
    <section className="border-b border-[var(--dc-border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between border-b border-[var(--dc-border-light)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">인기글</h3>
          <span className="rounded bg-signature-muted px-1.5 py-0.5 text-[10px] font-bold text-signature-darker">
            BEST
          </span>
        </div>
        <span className="text-[11px] text-[var(--text-faint)]">추천·조회·댓글 기준</span>
      </div>

      <div className="board-featured-grid grid grid-cols-1 gap-3 p-3 md:grid-cols-2 md:gap-4 md:p-4 lg:grid-cols-4">
        {posts.map((post) => {
          const thumbnail = getBoardThumbnail(post);
          const highlight = looksByNickname?.[post.author]?.postHighlightActive;

          return (
            <Link
              key={post.id}
              href={`/board/${post.id}`}
              className={`group block min-w-0 w-full overflow-hidden rounded-md border border-[var(--dc-border-light)] bg-[var(--surface)] text-left transition hover:border-signature/40 hover:shadow-sm ${
                highlight ? "shop-post-highlight" : ""
              }`}
            >
              <div className="relative aspect-[4/3] bg-[var(--surface-subtle)]">
                {thumbnail ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={thumbnail}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[var(--surface-subtle)] to-[var(--surface-elevated)] px-2 text-center text-[11px] font-semibold text-[var(--text-muted)]">
                    {post.category}
                  </div>
                )}
              </div>
              <div className="board-post-title-wrap px-2 py-2">
                <p className="board-post-title board-post-title-clamp text-[12px] leading-snug text-[var(--text-primary)] group-hover:text-signature-dark sm:text-[13px] sm:leading-4">
                  {post.title}
                  {post.comments.length > 0 && (
                    <span className="ml-1 font-semibold text-[#e03131]">
                      [{post.comments.length}]
                    </span>
                  )}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function pickFeaturedBoardPosts(posts: BoardPost[], limit = 4): BoardPost[] {
  return [...posts]
    .sort((a, b) => getBoardPopularityScore(b) - getBoardPopularityScore(a))
    .slice(0, limit);
}
