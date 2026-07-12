"use client";

import Link from "next/link";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  formatMarketplaceDate,
  formatMarketplacePrice,
  marketplaceStatusClass,
  type MarketplaceItem,
} from "@/lib/marketplace";

const statusClass = marketplaceStatusClass;

type MarketplaceCardProps = {
  item: MarketplaceItem;
  onLike: (id: string) => void;
  liking?: boolean;
};

export default function MarketplaceCard({
  item,
  onLike,
  liking = false,
}: MarketplaceCardProps) {
  const thumbnail = item.imageUrls[0] ?? "/window.svg";

  return (
    <article
      className={`portal-panel overflow-hidden transition hover:-translate-y-1 hover:shadow-md ${
        item.status === "판매완료" ? "opacity-90" : ""
      }`}
    >
      <Link href={`/marketplace/${item.id}`} className="block w-full text-left">
        <div className="relative h-56 w-full bg-signature-light/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt={item.title}
            className={`h-full w-full object-cover ${
              item.status === "판매완료" ? "grayscale-[35%]" : ""
            }`}
          />
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass[item.status]}`}
          >
            {item.status}
          </span>
          {item.status === "판매완료" && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900/25">
              <span className="rounded-full bg-stone-800/85 px-4 py-2 text-sm font-bold text-white">
                거래완료
              </span>
            </div>
          )}
        </div>

        <div className="p-5 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-signature-muted px-2.5 py-0.5 text-xs font-semibold text-signature-darker">
              {item.category}
            </span>
            <span className="text-xs text-stone-500">{item.condition}</span>
          </div>

          <h2 className="mt-2 line-clamp-2 text-lg font-bold text-stone-800">
            {item.title}
          </h2>
          <p className="mt-2 text-lg font-bold text-signature-dark">
            {formatMarketplacePrice(item.price)}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            {item.region} · {item.location}
          </p>

          <div className="mt-4 text-sm">
            <p className="flex flex-wrap items-center gap-1 text-stone-500">
              <span>판매</span>
              <AuthorWithGrade
                author={item.seller}
                nicknameClassName="text-stone-500"
                className="inline-flex max-w-full flex-wrap items-center gap-1"
              />
            </p>
            <p className="text-xs text-stone-400">
              {formatMarketplaceDate(item.createdAt)}
            </p>
            <div className="mt-2 flex gap-3 text-xs text-stone-400">
              <span>조회 {item.views}</span>
              <span>댓글 {item.comments.length}</span>
            </div>
          </div>
        </div>
      </Link>

      <div
        className="flex justify-end px-5 pb-5"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <EngagementLikeButton
          likes={item.likes}
          liking={liking}
          onLike={() => onLike(item.id)}
          label="관심"
          className="rounded-full bg-signature-light px-3 py-1.5 text-sm font-semibold text-signature-dark transition hover:bg-signature-muted disabled:opacity-60"
        />
      </div>
    </article>
  );
}
