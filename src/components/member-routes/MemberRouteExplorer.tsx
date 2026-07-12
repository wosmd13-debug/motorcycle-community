"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import MemberRouteCard from "@/components/member-routes/MemberRouteCard";
import MemberRouteDetail from "@/components/member-routes/MemberRouteDetail";
import {
  filterMemberRoutes,
  type MemberRoute,
} from "@/lib/member-route";
import {
  routeDifficulties,
  routeRegions,
  routeTypes,
  type RouteDifficulty,
  type RouteType,
} from "@/lib/routes-data";

type MemberRouteExplorerProps = {
  initialRoutes: MemberRoute[];
  initialOpenId?: string;
};

export default function MemberRouteExplorer({
  initialRoutes,
  initialOpenId = "",
}: MemberRouteExplorerProps) {
  const [routes, setRoutes] = useState(initialRoutes);
  const [selectedId, setSelectedId] = useState(initialOpenId || initialRoutes[0]?.id || "");
  const [region, setRegion] = useState("전체");
  const [difficulty, setDifficulty] = useState<RouteDifficulty | "전체">("전체");
  const [type, setType] = useState<RouteType | "전체">("전체");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setRoutes(initialRoutes);
  }, [initialRoutes]);

  const filteredRoutes = useMemo(
    () => filterMemberRoutes({ routes, region, difficulty, type, query }),
    [routes, region, difficulty, type, query]
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          회원들이 직접 그린 코스를 확인하고 나만의 코스도 등록해 보세요.
        </p>
        <Link href="/routes/create" className="portal-btn px-4 py-2 text-sm">
          + 코스 등록
        </Link>
      </div>

      <div className="rounded-3xl border border-signature/20 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          코스 검색
        </label>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="코스명, 지역, 작성자 검색..."
          className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-signature focus:bg-white"
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
            <FilterChip active={difficulty === "전체"} onClick={() => setDifficulty("전체")}>
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
        총 <strong className="text-signature-dark">{filteredRoutes.length}</strong>
        개의 회원 코스
      </p>

      {filteredRoutes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-signature/30 bg-signature-light/50 px-6 py-16 text-center">
          <p className="font-semibold text-slate-700">등록된 회원 코스가 없습니다</p>
          <p className="mt-2 text-sm text-slate-500">
            첫 번째 코스를 등록해 보세요.
          </p>
          <Link href="/routes/create" className="portal-btn mt-4 inline-flex px-4 py-2 text-sm">
            코스 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            {filteredRoutes.map((route) => (
              <MemberRouteCard
                key={route.id}
                route={route}
                isSelected={selectedRoute?.id === route.id}
                onSelect={() => setSelectedId(route.id)}
              />
            ))}
          </div>

          {selectedRoute && <MemberRouteDetail route={selectedRoute} />}
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
          ? "bg-signature-dark text-white"
          : "bg-white text-slate-600 ring-1 ring-signature/20 hover:bg-signature-light"
      }`}
    >
      {children}
    </button>
  );
}
