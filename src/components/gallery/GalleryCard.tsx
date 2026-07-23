"use client";

import Link from "next/link";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  formatGalleryDate,
  type GalleryPost,
} from "@/lib/gallery";
import type { MemberGradeId } from "@/lib/ranking";
import type { ShopCosmeticLook } from "@/lib/shop";

type GalleryCardProps = {
  post: GalleryPost;
  onLike: (id: string) => void;
  liking?: boolean;
  gradesByNickname?: Record<string, MemberGradeId>;
  looksByNickname?: Record<string, ShopCosmeticLook>;
};

const likeButtonClass =
  "gallery-ig-like-btn inline-flex min-h-0 items-center border-0 bg-transparent p-0 text-[11px] font-medium shadow-none transition disabled:opacity-60 touch-manipulation";

function GalleryLikeStat({
  likes,
  liking,
  onLike,
}: {
  likes: number;
  liking: boolean;
  onLike: () => void;
}) {
  return (
    <span
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <EngagementLikeButton
        likes={likes}
        liking={liking}
        onLike={onLike}
        label="❤️"
        className={`${likeButtonClass} text-white/90 hover:text-white`}
      />
    </span>
  );
}

function GalleryStatsRow({
  post,
  onLike,
  liking,
  gradesByNickname,
  looksByNickname,
}: {
  post: GalleryPost;
  onLike: (id: string) => void;
  liking: boolean;
  gradesByNickname?: Record<string, MemberGradeId>;
  looksByNickname?: Record<string, ShopCosmeticLook>;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/90">
      <GalleryLikeStat
        likes={post.likes}
        liking={liking}
        onLike={() => onLike(post.id)}
      />
      <span>👁 {post.views}</span>
      <span>💬 {post.comments.length}</span>
      <span className="text-white/70">·</span>
      <AuthorWithGrade
        author={post.author}
        authorGradeId={post.authorGradeId}
        gradesByNickname={gradesByNickname}
        looksByNickname={looksByNickname}
        nicknameClassName="text-white/90"
        className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-1"
        badgeSize="sm"
      />
    </div>
  );
}

export default function GalleryCard({
  post,
  onLike,
  liking = false,
  gradesByNickname,
  looksByNickname,
}: GalleryCardProps) {
  const spotlight = looksByNickname?.[post.author]?.gallerySpotlightActive;

  return (
    <article
      className={`gallery-ig-card group relative overflow-hidden bg-stone-100 dark:bg-stone-900 ${
        spotlight ? "shop-gallery-spotlight" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-stone-200 dark:bg-stone-800">
        <Link
          href={`/gallery/${post.id}`}
          className="block h-full w-full text-left"
          aria-label={`${post.title} 상세 보기`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            draggable={false}
            loading="lazy"
          />

          <div className="gallery-ig-overlay pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/45 via-transparent to-black/55 p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 sm:p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                {post.category}
              </span>
              <span className="text-[10px] font-medium text-white/85">
                {formatGalleryDate(post.createdAt)}
              </span>
            </div>

            <div className="board-post-title-wrap min-w-0 w-full pb-10">
              <h2 className="board-post-title board-post-title-clamp text-sm font-bold text-white drop-shadow">
                {post.title}
              </h2>
              <p className="mt-0.5 truncate text-[11px] text-white/85">
                {post.location}
              </p>
            </div>
          </div>
        </Link>

        <div
          className="gallery-ig-stats-bar absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2.5 pb-2 pt-7"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <GalleryStatsRow
            post={post}
            onLike={onLike}
            liking={liking}
            gradesByNickname={gradesByNickname}
            looksByNickname={looksByNickname}
          />
        </div>
      </div>

      <div className="gallery-ig-mobile-meta border-t border-stone-200/80 bg-white px-2.5 py-2 dark:border-stone-700 dark:bg-stone-950">
        <div className="board-post-title-wrap block w-full max-w-full">
          <p className="board-post-title board-post-title-clamp text-[13px] font-bold leading-snug text-stone-800 dark:text-stone-100">
            {post.title}
          </p>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-stone-500">{post.location}</p>
      </div>
    </article>
  );
}
