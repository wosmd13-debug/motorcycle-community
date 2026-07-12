"use client";

import Link from "next/link";
import WaypointRouteMap from "@/components/member-routes/WaypointRouteMap";
import MemberRouteLinkActions from "@/components/member-routes/MemberRouteLinkActions";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  formatMemberRouteDistance,
  formatMemberRouteDuration,
  type MemberRoute,
} from "@/lib/member-route";
import { buildMemberRouteHref } from "@/lib/route-links";

type MemberRouteMapPanelProps = {
  route: MemberRoute;
};

export default function MemberRouteMapPanel({ route }: MemberRouteMapPanelProps) {
  const start = route.waypoints[0];
  const end = route.waypoints[route.waypoints.length - 1];

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-signature-dark">
            회원 등록 바리코스
          </p>
          <h2 className="mt-1 text-2xl font-bold text-stone-800">{route.name}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
            <span>
              {route.region} · {route.type} · {route.difficulty}
            </span>
            <span aria-hidden>·</span>
            <AuthorWithGrade
              author={route.author}
              nicknameClassName="text-sm text-stone-500"
              className="inline-flex max-w-full flex-wrap items-center gap-1"
            />
          </p>
        </div>
        <Link
          href={buildMemberRouteHref(route.id)}
          className="rounded-full border border-signature/30 bg-signature-light px-4 py-2 text-xs font-semibold text-signature-dark hover:bg-signature-muted"
        >
          코스 상세 보기
        </Link>
      </div>

      {route.description && (
        <p className="rounded-2xl bg-signature-light/60 px-4 py-3 text-sm leading-6 text-stone-600">
          {route.description}
        </p>
      )}

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-signature-light/60 px-4 py-3">
          <dt className="text-xs text-stone-500">거리</dt>
          <dd className="mt-1 text-sm font-bold text-stone-800">
            {formatMemberRouteDistance(route.distanceKm)}
          </dd>
        </div>
        <div className="rounded-2xl bg-signature-light/60 px-4 py-3">
          <dt className="text-xs text-stone-500">예상 시간</dt>
          <dd className="mt-1 text-sm font-bold text-stone-800">
            {formatMemberRouteDuration(route.durationMin)}
          </dd>
        </div>
        <div className="rounded-2xl bg-signature-light/60 px-4 py-3">
          <dt className="text-xs text-stone-500">출발 · 도착</dt>
          <dd className="mt-1 text-sm font-bold text-stone-800">
            {start?.name ?? "-"} → {end?.name ?? "-"}
          </dd>
        </div>
      </dl>

      <WaypointRouteMap waypoints={route.waypoints} mapKey={`map-${route.id}`} />

      {route.waypoints.length >= 2 && (
        <MemberRouteLinkActions
          memberRouteId={route.id}
          waypoints={route.waypoints}
          routeName={route.name}
        />
      )}
    </div>
  );
}
