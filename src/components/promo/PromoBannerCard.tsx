"use client";

import Link from "next/link";
import PromoBusinessInfoSummary from "@/components/promo/PromoBusinessInfoSummary";
import PromoCategoryBadge from "@/components/promo/PromoCategoryBadge";
import PromoMedia from "@/components/promo/PromoMedia";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  formatPromoDate,
  getPromoCoverImage,
  type PromoPost,
} from "@/lib/promo";

type PromoBannerCardProps = {
  post: PromoPost;
  priority?: boolean;
};

export default function PromoBannerCard({
  post,
  priority = false,
}: PromoBannerCardProps) {
  const cover = getPromoCoverImage(post);

  return (
    <article className="overflow-hidden rounded-3xl border border-signature/30 bg-white shadow-md">
      <Link
        href={`/promo/${post.id}`}
        className="group relative block w-full text-left"
      >
        <div className="relative aspect-[21/7] w-full min-h-[140px] bg-gradient-to-r from-signature-dark via-signature to-signature-darker sm:min-h-[180px]">
          {cover ? (
            <PromoMedia
              src={cover}
              alt={post.title}
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              sizes="100vw"
              priority={priority}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/75 via-stone-900/45 to-stone-900/20" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-signature px-2.5 py-1 text-[10px] font-bold text-white">
                배너 광고
              </span>
              <PromoCategoryBadge category={post.category} size="sm" />
            </div>
            <h2 className="mt-3 max-w-3xl text-xl font-bold text-white sm:text-2xl">
              {post.title}
            </h2>
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/85">
              {post.content}
            </p>
            <PromoBusinessInfoSummary post={post} variant="banner" />
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/80">
              <AuthorWithGrade
                author={post.author}
                nicknameClassName="font-medium text-white"
                className="inline-flex max-w-full flex-wrap items-center gap-1.5"
              />
              <span>{formatPromoDate(post.createdAt)}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold text-white transition group-hover:bg-white/25">
                자세히 보기
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
