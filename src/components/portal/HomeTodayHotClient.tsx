"use client";

import Link from "next/link";
import { useState } from "react";
import { formatBoardDate } from "@/lib/board";
import type { HomeHotCard } from "@/lib/home-hot";
import { HOT_SORT_TABS, type HotSortKey } from "@/lib/home-portal";

type HomeTodayHotClientProps = {
  lists: Record<HotSortKey, HomeHotCard[]>;
};

function HotCard({ post }: { post: HomeHotCard }) {
  return (
    <Link href={post.href} className="home-post-card group">
      <div className="home-post-card-thumb">
        {post.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.thumb} alt="" />
        ) : (
          <div className="home-post-card-fallback">📝</div>
        )}
      </div>
      <div className="min-w-0">
        <p className="board-post-title board-post-title-clamp text-sm font-semibold text-stone-800 group-hover:text-signature-dark">
          {post.title}
        </p>
        <div className="home-post-card-meta mt-1.5">
          <span className="home-post-card-cat">{post.category}</span>
          <span>조회 {post.views}</span>
          <span>좋아요 {post.likes}</span>
          <span>댓글 {post.commentCount}</span>
          <span className="ml-auto hidden sm:inline">
            {formatBoardDate(post.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HomeTodayHotClient({ lists }: HomeTodayHotClientProps) {
  const [tab, setTab] = useState<HotSortKey>("views");
  const posts = lists[tab];

  return (
    <section id="today-hot" className="portal-panel home-reveal scroll-mt-20 overflow-hidden">
      <div className="portal-panel-head">
        <div className="flex items-center gap-2">
          <h2 className="portal-panel-title">오늘의 인기글</h2>
          <span className="portal-badge">HOT</span>
        </div>
        <Link href="/board" className="portal-panel-more">
          전체보기
        </Link>
      </div>

      <div className="home-hot-tabs" role="tablist" aria-label="인기 기준">
        {HOT_SORT_TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className="home-hot-tab"
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-slate-500">
          아직 인기 게시글이 없습니다.
        </p>
      ) : (
        <div className="home-card-grid">
          {posts.map((post) => (
            <HotCard key={`${tab}-${post.id}`} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
