"use client";

import Link from "next/link";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import PromoCategoryBadge from "@/components/promo/PromoCategoryBadge";
import PromoMedia from "@/components/promo/PromoMedia";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  formatPromoDate,
  getEffectiveBusinessStatus,
  getPromoBusinessHoursText,
  getPromoCoverImage,
  hasPromoBusinessInfo,
  isPromoBusinessCategory,
  type PromoPost,
} from "@/lib/promo";

type PromoCardProps = {
  post: PromoPost;
  onLike: (id: string) => void;
  liking?: boolean;
};

function PromoCardBusinessInfo({ post }: { post: PromoPost }) {
  if (!isPromoBusinessCategory(post.category) && !hasPromoBusinessInfo(post)) {
    return null;
  }

  const { address, phone } = post;
  const businessHoursText = getPromoBusinessHoursText(post);
  if (!address && !phone && !businessHoursText && !post.businessStatus) {
    return null;
  }

  const businessStatus = getEffectiveBusinessStatus(post);

  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-signature/15 bg-signature-light/40 px-3 py-2.5">
      {businessStatus && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">영업 현황</span>
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            {businessStatus}
          </span>
        </div>
      )}

      {phone && (
        <p className="text-sm text-stone-700">
          <span className="mr-1" aria-hidden>
            📞
          </span>
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            onClick={(event) => event.stopPropagation()}
            className="font-semibold text-signature-dark hover:underline"
          >
            {phone}
          </a>
        </p>
      )}

      {address && (
        <p className="text-sm leading-6 text-stone-600">
          <span className="mr-1" aria-hidden>
            📍
          </span>
          {address}
        </p>
      )}

      {businessHoursText && (
        <p className="text-xs text-stone-500">
          <span className="mr-1" aria-hidden>
            🕐
          </span>
          {businessHoursText}
        </p>
      )}
    </div>
  );
}

export default function PromoCard({
  post,
  onLike,
  liking = false,
}: PromoCardProps) {
  const cover = getPromoCoverImage(post);
  const showBusinessInfo =
    isPromoBusinessCategory(post.category) || hasPromoBusinessInfo(post);

  return (
    <article className="overflow-hidden rounded-3xl border border-signature/20 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/promo/${post.id}`} className="block w-full text-left">
        <div className="relative h-52 w-full bg-gradient-to-br from-signature-light to-signature-light">
          {cover ? (
            <PromoMedia
              src={cover}
              alt={post.title}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <p className="text-sm font-medium text-stone-500">{post.title}</p>
            </div>
          )}
          {post.youtubeVideoId && (
            <span className="absolute left-3 top-3 rounded-full bg-stone-900/75 px-2.5 py-1 text-[11px] font-bold text-white">
              영상
            </span>
          )}
          {post.imageUrls.length > 1 && (
            <span className="absolute right-3 top-3 rounded-full bg-stone-900/75 px-2.5 py-1 text-[11px] font-bold text-white">
              +{post.imageUrls.length - 1}
            </span>
          )}
        </div>
      </Link>

      <div className="p-5">
        <PromoCategoryBadge category={post.category} />
        <h2 className="mt-2 line-clamp-2 text-lg font-bold text-stone-800">
          {post.title}
        </h2>

        <PromoCardBusinessInfo post={post} />

        <p
          className={`line-clamp-2 text-sm text-stone-500 ${
            showBusinessInfo ? "mt-3" : "mt-2"
          }`}
        >
          {post.content}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 text-sm">
          <div>
            <AuthorWithGrade
              author={post.author}
              nicknameClassName="font-medium text-stone-600"
              className="inline-flex max-w-full flex-wrap items-center gap-1"
            />
            <p className="text-xs text-stone-400">{formatPromoDate(post.createdAt)}</p>
            <div className="mt-2 flex gap-3 text-xs text-stone-400">
              <span>조회 {post.views}</span>
              <span>댓글 {post.comments.length}</span>
            </div>
          </div>
          <span
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <EngagementLikeButton
              likes={post.likes}
              liking={liking}
              onLike={() => onLike(post.id)}
              className="rounded-full bg-signature-light px-3 py-1.5 font-semibold text-signature-dark transition hover:bg-signature-muted disabled:opacity-60"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
