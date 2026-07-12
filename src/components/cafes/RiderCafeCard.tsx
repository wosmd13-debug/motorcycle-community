"use client";

import Link from "next/link";
import Image from "next/image";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  formatRiderCafeDate,
  formatTodayOpenHours,
  type RiderCafeEntry,
} from "@/lib/rider-cafe";

type RiderCafeCardProps = {
  entry: RiderCafeEntry;
  onLike: (id: string) => void;
  liking?: boolean;
};

export default function RiderCafeCard({
  entry,
  onLike,
  liking = false,
}: RiderCafeCardProps) {
  return (
    <article className="portal-panel overflow-hidden transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/cafes/${entry.id}`} className="block w-full text-left">
        <div className="relative flex h-60 w-full items-center justify-center bg-signature-light/40 p-3">
          <Image
            src={entry.imageUrl}
            alt={entry.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-signature-dark shadow-sm">
            ☕ {entry.region}
          </span>
        </div>
      </Link>

      <div className="p-5">
        <h2 className="text-lg font-bold text-stone-800">{entry.name}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">📍 {entry.address}</p>

        {(entry.weeklyHours || entry.phone) && (
          <div className="mt-2 space-y-1 text-xs text-slate-500">
            {entry.weeklyHours && (
              <p>🕐 {formatTodayOpenHours(entry.weeklyHours)}</p>
            )}
            {entry.phone && <p>📞 {entry.phone}</p>}
          </div>
        )}

        {entry.amenities && entry.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {entry.amenities.slice(0, 3).map((item) => (
              <span
                key={item}
                className="rounded-full bg-signature-light px-2 py-0.5 text-[11px] font-medium text-signature-darker ring-1 ring-signature/20"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 text-sm">
          <div>
            <p className="flex flex-wrap items-center gap-1 text-slate-500">
              <span>by</span>
              <AuthorWithGrade
                author={entry.author}
                nicknameClassName="text-slate-500"
                className="inline-flex max-w-full flex-wrap items-center gap-1"
              />
            </p>
            <p className="text-xs text-slate-400">
              {formatRiderCafeDate(entry.createdAt)}
            </p>
            <p className="mt-2 text-xs text-slate-400">👁 {entry.views}</p>
          </div>
          <span
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <EngagementLikeButton
              likes={entry.likes}
              liking={liking}
              onLike={() => onLike(entry.id)}
              label="❤️"
              className="rounded-full bg-signature-light px-3 py-1.5 font-semibold text-signature-dark transition hover:bg-signature-muted disabled:opacity-60"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
