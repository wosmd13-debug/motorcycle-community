"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import RidingMapSection from "@/components/RidingMapSection";
import MapAccessNotice from "@/components/map/MapAccessNotice";
import MapEngineStatus from "@/components/map/MapEngineStatus";
import type { RidingSpot } from "@/lib/mock-data";

const BariMapSection = dynamic(
  () => import("@/components/map/BariMapSection"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-8 flex min-h-[420px] items-center justify-center rounded-3xl border border-orange-100 bg-orange-50 text-sm text-slate-500">
        전국 바리 코스 지도 불러오는 중...
      </div>
    ),
  }
);

type MapPageContentProps = {
  spots: RidingSpot[];
};

type MapTab = "spots" | "routes";

export default function MapPageContent({ spots }: MapPageContentProps) {
  const [tab, setTab] = useState<MapTab>("routes");

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        <TabButton active={tab === "routes"} onClick={() => setTab("routes")}>
          🏍️ 전국 바리 코스
        </TabButton>
        <TabButton active={tab === "spots"} onClick={() => setTab("spots")}>
          📍 추천 라이딩 스팟
        </TabButton>
      </div>

      <MapAccessNotice />

      <MapEngineStatus />

      {tab === "routes" ? (
        <BariMapSection />
      ) : (
        <RidingMapSection spots={spots} />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-orange-500 text-white"
          : "bg-white text-slate-600 ring-1 ring-orange-100 hover:bg-orange-50"
      }`}
    >
      {children}
    </button>
  );
}
