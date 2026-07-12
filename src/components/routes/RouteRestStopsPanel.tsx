"use client";

import Link from "next/link";
import { placeCategoryLabels, placeCategoryMarker } from "@/lib/places-data";
import {
  estimateRestBreakCount,
  summarizeRestStops,
  type RouteRestStop,
} from "@/lib/route-detail";
import { buildMapHref } from "@/lib/route-links";

export default function RouteRestStopsPanel({
  routeId,
  stops,
  distanceKm,
}: {
  routeId: number;
  stops: RouteRestStop[];
  distanceKm: number;
}) {
  const suggestedBreaks = estimateRestBreakCount(distanceKm);

  if (stops.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-signature/30 bg-signature-light/30 px-4 py-5">
        <h3 className="text-sm font-bold text-slate-800">휴식·주유 포인트</h3>
        <p className="mt-2 text-sm text-slate-500">
          이 코스에 등록된 휴식 스팟이 아직 없습니다. 약 {distanceKm}km 기준{" "}
          {suggestedBreaks}회 정도 휴식을 계획하는 것을 권장합니다.
        </p>
        <Link
          href={buildMapHref({ routeId })}
          className="mt-3 inline-block text-sm font-semibold text-signature-dark hover:underline"
        >
          지도에서 코스 보기 →
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">휴식·주유 포인트</h3>
          <p className="mt-1 text-xs text-slate-500">
            {summarizeRestStops(stops)} · 권장 휴식 {suggestedBreaks}회
          </p>
        </div>
        <Link
          href={buildMapHref({ routeId })}
          className="text-xs font-semibold text-signature-dark hover:underline"
        >
          지도에서 보기
        </Link>
      </div>

      <ol className="mt-4 space-y-2">
        {stops.map((stop) => (
          <li
            key={stop.id}
            className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-signature-dark ring-2 ring-signature/30">
              {placeCategoryMarker[stop.category]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-800">{stop.name}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                  {placeCategoryLabels[stop.category]}
                </span>
              </div>
              {stop.routeNote && (
                <p className="mt-1 text-xs font-medium text-signature-dark">
                  {stop.routeNote}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">{stop.address}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
