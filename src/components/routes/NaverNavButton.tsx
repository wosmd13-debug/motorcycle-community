"use client";

import { useMemo } from "react";
import {
  buildNaverNavLinks,
  openNaverNavigation,
  type NaverNavMode,
} from "@/lib/naver-nav";
import type { RouteWaypoint } from "@/lib/routes-data";

type NaverNavButtonProps = {
  waypoints: RouteWaypoint[];
  routeName?: string;
  mode?: NaverNavMode;
  compact?: boolean;
  className?: string;
};

export default function NaverNavButton({
  waypoints,
  routeName,
  mode = "navigation",
  compact = false,
  className,
}: NaverNavButtonProps) {
  const links = useMemo(
    () => buildNaverNavLinks(waypoints, { mode }),
    [waypoints, mode]
  );

  if (!links) return null;

  const label = compact ? "내비 시작" : "네이버 내비 시작";

  const baseClass = compact
    ? "inline-flex min-h-[44px] items-center rounded-full border border-[#03c75a]/30 bg-[#03c75a]/10 px-3 py-2 text-xs font-semibold text-[#03a94b] hover:bg-[#03c75a]/15"
    : "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#03c75a]/35 bg-[#03c75a] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#02b350]";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => openNaverNavigation(waypoints, mode)}
        className={baseClass}
        title={
          routeName
            ? `${routeName} 코스 내비게이션을 바로 시작합니다.`
            : "네이버 지도 내비게이션을 바로 시작합니다."
        }
      >
        <NaverMark inverted={!compact} />
        {label}
      </button>
      {links.truncated && !compact && (
        <p className="mt-1 text-[11px] text-stone-500">
          경유지가 많아 네이버 내비에는 {links.usedWaypointCount}곳만 전달됩니다.
        </p>
      )}
    </div>
  );
}

export function NaverNavActionGroup({
  waypoints,
  routeName,
  compact = false,
}: {
  waypoints: RouteWaypoint[];
  routeName?: string;
  compact?: boolean;
}) {
  const links = useMemo(
    () => buildNaverNavLinks(waypoints, { mode: "navigation" }),
    [waypoints]
  );
  if (!links) return null;

  const primaryClass = compact
    ? "inline-flex min-h-[44px] items-center rounded-full border border-[#03c75a]/35 bg-[#03c75a] px-3 py-2 text-xs font-bold text-white hover:bg-[#02b350]"
    : "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#03c75a]/35 bg-[#03c75a] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#02b350]";

  const secondaryClass = compact
    ? "inline-flex min-h-[44px] items-center rounded-full border px-3 py-2 text-xs font-semibold"
    : "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold";

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openNaverNavigation(waypoints, "navigation")}
          className={primaryClass}
        >
          <NaverMark inverted />
          {compact ? "내비 시작" : "네이버 내비 바로 시작"}
        </button>
        <button
          type="button"
          onClick={() => openNaverNavigation(waypoints, "route")}
          className={`${secondaryClass} border-signature/25 bg-white text-signature-dark hover:bg-signature-light`}
        >
          {compact ? "경로 보기" : "경로 미리보기"}
        </button>
      </div>
      {!compact && (
        <p className="text-[11px] text-stone-500">
          내비 시작을 누르면 현재 위치에서 목적지까지 안내가 시작됩니다. 앱이
          열리지 않으면 경로 보기로 전환해 보세요.
        </p>
      )}
      {links.truncated && !compact && (
        <p className="text-[11px] text-stone-500">
          경유지가 많아 네이버 내비에는 {links.usedWaypointCount}곳만 전달됩니다.
        </p>
      )}
      {routeName && !compact && (
        <p className="sr-only">{routeName} 코스 내비 연동</p>
      )}
    </div>
  );
}

function NaverMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span
      aria-hidden
      className={`mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-black ${
        inverted
          ? "bg-white text-[#03c75a]"
          : "bg-[#03c75a] text-white"
      }`}
    >
      N
    </span>
  );
}
