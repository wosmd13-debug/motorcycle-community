"use client";

import Link from "next/link";
import SidebarAuth from "@/components/auth/SidebarAuth";
import {
  filterBoardPosts,
  getBoardPopularityScore,
  type BoardPost,
} from "@/lib/board";

type BoardSidebarProps = {
  posts: BoardPost[];
};

export default function BoardSidebar({ posts }: BoardSidebarProps) {
  const popularPosts = filterBoardPosts({
    posts,
    sort: "popular",
  }).slice(0, 10);

  return (
    <aside className="space-y-3">
      <SidebarAuth />

      <section className="overflow-hidden border border-[var(--dc-border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--dc-border-light)] bg-[var(--dc-surface-muted)] px-3 py-2.5">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">인기글 순위</h3>
        </div>
        <ol className="divide-y divide-[var(--border-subtle)]">
          {popularPosts.map((post, index) => (
            <li key={post.id}>
              <Link
                href={`/board/${post.id}`}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-[var(--dc-hover)]"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-bold ${
                    index < 3
                      ? "bg-[var(--dc-accent)] text-white"
                      : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="board-post-title-wrap min-w-0 flex-1">
                  <span className="board-post-title board-post-title-clamp text-[12px] text-[var(--text-secondary)]">
                    {post.title}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] text-[var(--text-faint)]">
                  {getBoardPopularityScore(post)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
