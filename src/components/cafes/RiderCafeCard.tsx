"use client";

import Image from "next/image";
import {
  formatRiderCafeDate,
  formatTodayOpenHours,
  type RiderCafeEntry,
} from "@/lib/rider-cafe";

type RiderCafeCardProps = {
  entry: RiderCafeEntry;
  onOpen: (entry: RiderCafeEntry) => void;
  onLike: (id: string) => void;
  liking?: boolean;
};

export default function RiderCafeCard({
  entry,
  onOpen,
  onLike,
  liking = false,
}: RiderCafeCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="block w-full text-left"
      >
        <div className="relative flex h-60 w-full items-center justify-center bg-slate-100 p-3">
          <Image
            src={entry.imageUrl}
            alt={entry.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-orange-700 shadow-sm">
            ☕ {entry.region}
          </span>
        </div>
      </button>

      <div className="p-5">
        <h2 className="text-lg font-bold text-slate-800">{entry.name}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">📍 {entry.address}</p>

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
                className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 ring-1 ring-orange-100"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 text-sm">
          <div>
            <p className="text-slate-500">by {entry.author}</p>
            <p className="text-xs text-slate-400">
              {formatRiderCafeDate(entry.createdAt)}
            </p>
            <p className="mt-2 text-xs text-slate-400">👁 {entry.views}</p>
          </div>
          <button
            type="button"
            onClick={() => onLike(entry.id)}
            disabled={liking}
            className="rounded-full bg-orange-50 px-3 py-1.5 font-semibold text-orange-600 transition hover:bg-orange-100 disabled:opacity-60"
          >
            ❤️ {entry.likes}
          </button>
        </div>
      </div>
    </article>
  );
}
