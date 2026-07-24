"use client";

import Link from "next/link";
import { formatBoardDate } from "@/lib/board";
import type { HomeHotCard } from "@/lib/home-hot";

type HomeTodayHotClientProps = {
  posts: HomeHotCard[];
};

function CategoryFallback({ category }: { category: string }) {
  const initial = category.trim().slice(0, 1) || "글";
  return (
    <div className="home-post-card-fallback home-post-card-fallback-cat" aria-hidden>
      <span>{initial}</span>
    </div>
  );
}

function HotCard({ post, rank }: { post: HomeHotCard; rank: number }) {
  return (
    <Link href={post.href} className="home-post-card home-hot-item group">
      <div className="home-post-card-thumb">
        {rank <= 3 && (
          <span className="home-hot-rank" data-rank={rank}>
            {rank}
          </span>
        )}
        {post.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumb}
            alt={`${post.title} 썸네일`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <CategoryFallback category={post.category} />
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
          {post.commentCount > 0 ? (
            <span className="home-hot-comments">댓글 {post.commentCount}</span>
          ) : (
            <span>댓글 0</span>
          )}
          <span className="ml-auto hidden sm:inline">
            {formatBoardDate(post.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HomeTodayHotClient({ posts }: HomeTodayHotClientProps) {
  return (
    <section
      id="today-hot"
      className="portal-panel home-reveal scroll-mt-20 overflow-hidden"
    >
      <div className="portal-panel-head">
        <div className="flex items-center gap-2">
          <h2 className="portal-panel-title">오늘의 인기글</h2>
          <span className="portal-badge">HOT</span>
        </div>
        <Link href="/board" className="portal-panel-more">
          전체보기
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="home-empty-state">
          <p className="home-empty-state-title">
            아직 오늘의 인기글이 없어요
          </p>
          <p className="home-empty-state-copy">
            첫 이야기의 주인공이 되어 보세요.
          </p>
          <Link href="/board" className="home-hero-cta home-hero-cta-primary">
            글 작성하러 가기
          </Link>
        </div>
      ) : (
        <div className="home-card-grid home-hot-list">
          {posts.map((post, index) => (
            <HotCard key={post.id} post={post} rank={index + 1} />
          ))}
        </div>
      )}
    </section>
  );
}
