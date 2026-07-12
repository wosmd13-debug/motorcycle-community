"use client";

import { useState } from "react";
import { difficultyMeta } from "@/lib/route-detail";
import type { RouteDifficulty } from "@/lib/routes-data";

export default function RouteDifficultyPanel({
  difficulty,
  distanceKm,
  duration,
}: {
  difficulty: RouteDifficulty;
  distanceKm?: number;
  duration?: string;
}) {
  const meta = difficultyMeta[difficulty];

  return (
    <section className="rounded-2xl border border-signature/20 bg-gradient-to-br from-signature-light/50 to-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-signature-dark">난이도 안내</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${meta.badgeClass}`}
            >
              {meta.label}
            </span>
            <span className="text-sm font-semibold text-stone-700">
              {meta.summary}
            </span>
          </div>
        </div>
        {(distanceKm != null || duration) && (
          <div className="text-right text-xs text-stone-500">
            {distanceKm != null && <p>약 {distanceKm}km</p>}
            {duration && <p>{duration}</p>}
          </div>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">{meta.description}</p>
      <p className="mt-2 text-xs font-medium text-stone-500">추천: {meta.skill}</p>
    </section>
  );
}
