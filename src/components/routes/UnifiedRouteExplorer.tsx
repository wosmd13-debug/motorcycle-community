"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import MemberRouteCard from "@/components/member-routes/MemberRouteCard";
import MemberRouteDetail from "@/components/member-routes/MemberRouteDetail";
import RouteCard from "@/components/routes/RouteCard";
import RouteDetail from "@/components/routes/RouteDetail";
import { RoutesExplorerProvider } from "@/components/routes/RoutesExplorerContext";
import {
  filterMemberRoutes,
  type MemberRoute,
} from "@/lib/member-route";
import type { RiderCafeEntry } from "@/lib/rider-cafe";
import {
  filterRoutes,
  routeDifficulties,
  routeRegions,
  routeTypes,
  type BariRoute,
  type RouteDifficulty,
  type RouteType,
} from "@/lib/routes-data";
import {
  replaceRoutesOpenId,
  runWithRoutesScrollPin,
} from "@/lib/routes-page-scroll";

const RouteMap = dynamic(() => import("@/components/routes/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500 lg:min-h-[420px]">
      지도 불러오는 중...
    </div>
  ),
});

const WaypointRouteMap = dynamic(
  () => import("@/components/member-routes/WaypointRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500 lg:min-h-[420px]">
        지도 불러오는 중...
      </div>
    ),
  }
);

type RouteSourceFilter = "전체" | "추천" | "회원등록";

type UnifiedRouteItem =
  | { kind: "official"; route: BariRoute; key: string }
  | { kind: "member"; route: MemberRoute; key: string };

type UnifiedRouteExplorerProps = {
  initialBariRoutes: BariRoute[];
  initialMemberRoutes: MemberRoute[];
  initialCommunityCafes: RiderCafeEntry[];
  initialQuery?: string;
  initialOpenId?: string;
  initialSource?: RouteSourceFilter;
};

function resolveInitialSelection(
  openId: string,
  bariRoutes: BariRoute[],
  memberRoutes: MemberRoute[]
): UnifiedRouteItem | null {
  if (!openId) return null;

  const officialId = Number(openId);
  if (Number.isFinite(officialId)) {
    const official = bariRoutes.find((route) => route.id === officialId);
    if (official) {
      return { kind: "official", route: official, key: `official-${official.id}` };
    }
  }

  const member = memberRoutes.find((route) => route.id === openId);
  if (member) {
    return { kind: "member", route: member, key: `member-${member.id}` };
  }

  return null;
}

export default function UnifiedRouteExplorer({
  initialBariRoutes,
  initialMemberRoutes,
  initialCommunityCafes,
  initialQuery = "",
  initialOpenId = "",
  initialSource = "전체",
}: UnifiedRouteExplorerProps) {
  const [bariRoutes, setBariRoutes] = useState(initialBariRoutes);
  const [memberRoutes, setMemberRoutes] = useState(initialMemberRoutes);
  const [source, setSource] = useState<RouteSourceFilter>(initialSource);
  const [region, setRegion] = useState("전체");
  const [difficulty, setDifficulty] = useState<RouteDifficulty | "전체">("전체");
  const [type, setType] = useState<RouteType | "전체">("전체");
  const [query, setQuery] = useState(initialQuery);
  const searchParams = useSearchParams();
  const urlRouteId = searchParams.get("id") ?? "";

  const initialSelection = resolveInitialSelection(
    initialOpenId,
    bariRoutes,
    memberRoutes
  );
  const [selectedKey, setSelectedKey] = useState(
    initialSelection?.key ??
      (source === "회원등록"
        ? memberRoutes[0]
          ? `member-${memberRoutes[0].id}`
          : ""
        : `official-${bariRoutes[0]?.id ?? 1}`)
  );

  useEffect(() => {
    setBariRoutes(initialBariRoutes);
    setMemberRoutes(initialMemberRoutes);
  }, [initialBariRoutes, initialMemberRoutes]);

  const filteredOfficial = useMemo(
    () => filterRoutes(bariRoutes, { region, difficulty, type, query }),
    [bariRoutes, region, difficulty, type, query]
  );

  const filteredMember = useMemo(
    () =>
      filterMemberRoutes({
        routes: memberRoutes,
        region,
        difficulty,
        type,
        query,
      }),
    [memberRoutes, region, difficulty, type, query]
  );

  const unifiedRoutes = useMemo(() => {
    const items: UnifiedRouteItem[] = [];

    if (source !== "회원등록") {
      items.push(
        ...filteredOfficial.map((route) => ({
          kind: "official" as const,
          route,
          key: `official-${route.id}`,
        }))
      );
    }

    if (source !== "추천") {
      items.push(
        ...filteredMember.map((route) => ({
          kind: "member" as const,
          route,
          key: `member-${route.id}`,
        }))
      );
    }

    return items;
  }, [filteredOfficial, filteredMember, source]);

  const selectedItem =
    unifiedRoutes.find((item) => item.key === selectedKey) ?? unifiedRoutes[0];

  const handleSelect = useCallback((key: string) => {
    runWithRoutesScrollPin(() => {
      setSelectedKey(key);
    }, 1200);
  }, []);

  const viewOnMap = useCallback(
    (routeId: string) => {
      runWithRoutesScrollPin(() => {
        const selection = resolveInitialSelection(
          routeId,
          bariRoutes,
          memberRoutes
        );
        if (selection) {
          setSelectedKey(selection.key);
        }
        replaceRoutesOpenId(routeId);
      }, 1200);
    },
    [bariRoutes, memberRoutes]
  );

  useEffect(() => {
    if (!urlRouteId) return;

    const selection = resolveInitialSelection(
      urlRouteId,
      bariRoutes,
      memberRoutes
    );
    if (!selection || selection.key === selectedKey) return;

    runWithRoutesScrollPin(() => {
      setSelectedKey(selection.key);
    }, 1200);
  }, [urlRouteId, bariRoutes, memberRoutes, selectedKey]);

  useEffect(() => {
    if (
      unifiedRoutes.length > 0 &&
      !unifiedRoutes.some((item) => item.key === selectedKey)
    ) {
      setSelectedKey(unifiedRoutes[0].key);
    }
  }, [unifiedRoutes, selectedKey]);

  return (
    <RoutesExplorerProvider viewOnMap={viewOnMap}>
      <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          추천 바리코스와 회원이 등록한 동선을 함께 둘러보고, 직접 코스를
          등록해 공유할 수 있습니다.
        </p>
        <Link
          href="/routes/create"
          className="portal-btn px-4 py-2 text-sm"
        >
          + 바리코스 등록
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
          placeholder="코스명, 지역, 작성자, 키워드로 검색..."
          className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-signature focus:bg-white"
        />

        <div className="mt-4 space-y-3">
          <FilterRow label="구분">
            {(["전체", "추천", "회원등록"] as const).map((item) => (
              <FilterChip
                key={item}
                active={source === item}
                onClick={() => setSource(item)}
              >
                {item}
              </FilterChip>
            ))}
          </FilterRow>

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
        총 <strong className="text-signature-dark">{unifiedRoutes.length}</strong>
        개의 바리코스
        {source === "전체" && (
          <span className="text-slate-400">
            {" "}
            (추천 {filteredOfficial.length} · 회원등록 {filteredMember.length})
          </span>
        )}
      </p>

      {unifiedRoutes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-signature/30 bg-signature-light/50 px-6 py-16 text-center">
          <p className="font-semibold text-slate-700">
            조건에 맞는 바리코스가 없습니다
          </p>
          <p className="mt-2 text-sm text-slate-500">
            필터를 바꾸거나 직접 코스를 등록해 보세요.
          </p>
          <Link href="/routes/create" className="portal-btn mt-4 inline-flex px-4 py-2 text-sm">
            바리코스 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4 [overflow-anchor:none]">
            {unifiedRoutes.map((item) => {
              const isSelected = selectedItem?.key === item.key;

              return (
                <Fragment key={item.key}>
                  {item.kind === "official" ? (
                    <RouteCard
                      route={item.route}
                      isSelected={isSelected}
                      onSelect={() => handleSelect(item.key)}
                      onDeleted={(routeId) => {
                        setBariRoutes((prev) =>
                          prev.filter((route) => route.id !== routeId)
                        );
                      }}
                    />
                  ) : (
                    <MemberRouteCard
                      route={item.route}
                      isSelected={isSelected}
                      onSelect={() => handleSelect(item.key)}
                      onDeleted={(routeId) => {
                        setMemberRoutes((prev) =>
                          prev.filter((route) => route.id !== routeId)
                        );
                      }}
                    />
                  )}
                  {isSelected && (
                    <div className="min-h-[320px] pt-1 lg:min-h-[420px]">
                      {item.kind === "official" ? (
                        <RouteMap route={item.route} />
                      ) : (
                        <WaypointRouteMap
                          key={item.route.id}
                          waypoints={item.route.waypoints}
                          mapKey={item.route.id}
                        />
                      )}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>

          {selectedItem && (
            <div className="min-w-0 space-y-6">
              {selectedItem.kind === "official" ? (
                <RouteDetail
                  route={selectedItem.route}
                  communityCafes={initialCommunityCafes}
                  onDeleted={(routeId) => {
                    setBariRoutes((prev) =>
                      prev.filter((route) => route.id !== routeId)
                    );
                  }}
                />
              ) : (
                <MemberRouteDetail
                  key={selectedItem.key}
                  route={selectedItem.route}
                  showMapSection={false}
                  onDeleted={(routeId) => {
                    setMemberRoutes((prev) =>
                      prev.filter((route) => route.id !== routeId)
                    );
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </RoutesExplorerProvider>
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
