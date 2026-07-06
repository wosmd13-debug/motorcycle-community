"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import RouteCard from "@/components/routes/RouteCard";
import RouteDetail from "@/components/routes/RouteDetail";
import MapAccessNotice from "@/components/map/MapAccessNotice";
import MapEngineStatus from "@/components/map/MapEngineStatus";
import {
  bariRoutes,
  filterRoutes,
  routeDifficulties,
  routeRegions,
  routeTypes,
  type RouteDifficulty,
  type RouteType,
} from "@/lib/routes-data";

const RouteMap = dynamic(() => import("@/components/routes/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-orange-100 bg-orange-50 text-sm text-slate-500 lg:min-h-[420px]">
      지도 불러오는 중...
    </div>
  ),
});

export default function RouteExplorer() {
  const [selectedId, setSelectedId] = useState(bariRoutes[0]?.id ?? 1);
  const [region, setRegion] = useState("전체");
  const [difficulty, setDifficulty] = useState<RouteDifficulty | "전체">("전체");
  const [type, setType] = useState<RouteType | "전체">("전체");
  const [query, setQuery] = useState("");

  const filteredRoutes = useMemo(
    () => filterRoutes({ region, difficulty, type, query }),
    [region, difficulty, type, query]
  );

  const selectedRoute =
    filteredRoutes.find((route) => route.id === selectedId) ?? filteredRoutes[0];

  useEffect(() => {
    if (
      filteredRoutes.length > 0 &&
      !filteredRoutes.some((route) => route.id === selectedId)
    ) {
      setSelectedId(filteredRoutes[0].id);
    }
  }, [filteredRoutes, selectedId]);

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          코스 검색
        </label>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="코스명, 지역, 키워드로 검색..."
          className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-300 focus:bg-white"
        />

        <div className="mt-4 space-y-3">
          <FilterRow label="지역">
            {routeRegions.map((item) => (
              <FilterChip
                key={item}
                active={region === item}
                onClick={() => setRegion(item)}
              >
                {item}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="난이도">
            <FilterChip
              active={difficulty === "전체"}
              onClick={() => setDifficulty("전체")}
            >
              전체
            </FilterChip>
            {routeDifficulties.map((item) => (
              <FilterChip
                key={item}
                active={difficulty === item}
                onClick={() => setDifficulty(item)}
              >
                {item}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="유형">
            <FilterChip active={type === "전체"} onClick={() => setType("전체")}>
              전체
            </FilterChip>
            {routeTypes.map((item) => (
              <FilterChip
                key={item}
                active={type === item}
                onClick={() => setType(item)}
              >
                {item}
              </FilterChip>
            ))}
          </FilterRow>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        총 <strong className="text-orange-600">{filteredRoutes.length}</strong>
        개의 바리 코스
      </p>

      <MapAccessNotice />

      <MapEngineStatus />

      {filteredRoutes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-4 font-semibold text-slate-700">
            조건에 맞는 코스가 없습니다
          </p>
          <p className="mt-2 text-sm text-slate-500">
            필터를 바꾸거나 검색어를 수정해 보세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            {filteredRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                isSelected={selectedRoute?.id === route.id}
                onSelect={() => setSelectedId(route.id)}
              />
            ))}
          </div>

          {selectedRoute && (
            <div className="min-w-0 space-y-6">
              <RouteMap route={selectedRoute} />
              <RouteDetail route={selectedRoute} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-orange-500 text-white"
          : "bg-white text-slate-600 ring-1 ring-orange-100 hover:bg-orange-50"
      }`}
    >
      {children}
    </button>
  );
}
