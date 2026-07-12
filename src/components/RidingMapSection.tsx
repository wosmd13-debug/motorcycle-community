"use client";

import { useState } from "react";
import RidingMap from "@/components/RidingMap";
import type { RidingSpot } from "@/lib/mock-data";

type RidingMapSectionProps = {
  spots: RidingSpot[];
};

export default function RidingMapSection({ spots }: RidingMapSectionProps) {
  const [selectedId, setSelectedId] = useState<number | null>(spots[0]?.id ?? null);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <RidingMap
          spots={spots}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">추천 라이딩 코스</h2>
        <p className="text-sm text-slate-500">
          코스를 클릭하면 지도에서 해당 위치로 이동합니다.
        </p>
        {spots.map((spot) => {
          const isSelected = selectedId === spot.id;
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => setSelectedId(spot.id)}
              className={`w-full rounded-3xl border p-5 text-left shadow-sm transition ${
                isSelected
                  ? "border-signature/40 bg-signature-light ring-2 ring-signature/30"
                  : "border-signature/20 bg-white hover:border-signature/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-signature-dark">
                    {spot.region}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-800">
                    {spot.name}
                  </h3>
                </div>
                <span className="shrink-0 rounded-full bg-signature-light px-3 py-1 text-xs font-semibold text-signature-dark">
                  {spot.distance}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {spot.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
